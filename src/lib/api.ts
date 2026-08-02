import type {
  AppState,
  BatchTemplate,
  Bin,
  MeterColor,
  Preset,
  Profile,
  RentmanEquipmentOption,
  RentmanFolder,
} from './types'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export const api = {
  getState: () => req<AppState>('/api/state'),

  patchProfile: (patch: Partial<Profile>) =>
    req<Profile>('/api/profile', { method: 'PATCH', body: JSON.stringify(patch) }),

  uploadLogo: async (file: File) => {
    const body = new FormData()
    body.append('file', file)
    const res = await fetch('/api/profile/logo', { method: 'POST', body })
    if (!res.ok) {
      let message = res.statusText
      try {
        const j = (await res.json()) as { error?: string }
        if (j.error) message = j.error
      } catch {
        /* ignore */
      }
      throw new Error(message)
    }
    return res.json() as Promise<Profile>
  },

  uploadLogoDataUrl: (logoDataUrl: string) =>
    req<Profile>('/api/profile/logo', {
      method: 'POST',
      body: JSON.stringify({ logoDataUrl }),
    }),

  upsertMeterColor: (label: string, color: string, textColor: string) =>
    req<MeterColor[]>('/api/meter-colors', {
      method: 'PUT',
      body: JSON.stringify({ label, color, textColor }),
    }),

  deleteMeterColor: (id: string) =>
    req<{ ok: boolean }>(`/api/meter-colors/${id}`, { method: 'DELETE' }),

  createPreset: (body: Partial<Preset> & { kind?: Preset['kind'] }) =>
    req<Preset>('/api/presets', { method: 'POST', body: JSON.stringify(body) }),

  updatePreset: (id: string, patch: Partial<Preset>) =>
    req<Preset>(`/api/presets/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  deletePreset: (id: string) =>
    req<{ ok: boolean }>(`/api/presets/${id}`, { method: 'DELETE' }),

  saveTemplate: (name: string, items: BatchTemplate['items']) =>
    req<BatchTemplate>('/api/templates', {
      method: 'POST',
      body: JSON.stringify({ name, items }),
    }),

  deleteTemplate: (id: string) =>
    req<{ ok: boolean }>(`/api/templates/${id}`, { method: 'DELETE' }),

  createBin: (body: Partial<Bin>) =>
    req<Bin>('/api/bins', { method: 'POST', body: JSON.stringify(body) }),

  updateBin: (id: string, patch: Partial<Bin>) =>
    req<Bin>(`/api/bins/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  regenerateBinQr: (id: string) =>
    req<Bin>(`/api/bins/${id}/regenerate-qr`, { method: 'POST' }),

  deleteBin: (id: string) =>
    req<{ ok: boolean }>(`/api/bins/${id}`, { method: 'DELETE' }),

  makeQr: (payload: string) =>
    req<{ dataUrl: string }>('/api/qr', {
      method: 'POST',
      body: JSON.stringify({ payload }),
    }),

  rentmanStatus: () => req<{ configured: boolean }>('/api/rentman/status'),

  rentmanFolders: () => req<RentmanFolder[]>('/api/rentman/folders'),

  rentmanEquipment: (folderId: number) =>
    req<RentmanEquipmentOption[]>(`/api/rentman/equipment?folderId=${folderId}`),

  rentmanImport: (equipmentId: number, binId?: string) =>
    req<Bin>('/api/rentman/import', {
      method: 'POST',
      body: JSON.stringify({ equipmentId, binId }),
    }),
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Verklein logo voor snelle/betrouwbare upload (max ~1200px, JPEG/PNG/WebP). */
export async function compressImageFile(file: File, maxEdge = 1200): Promise<File> {
  if (file.type === 'image/svg+xml') return file
  if (!file.type.startsWith('image/')) return file

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const preferPng = file.type === 'image/png' || file.type === 'image/webp'
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, preferPng ? 'image/png' : 'image/jpeg', 0.9),
  )
  if (!blob) return file
  const name = file.name.replace(/\.[^.]+$/, preferPng ? '.png' : '.jpg')
  return new File([blob], name, { type: blob.type })
}
