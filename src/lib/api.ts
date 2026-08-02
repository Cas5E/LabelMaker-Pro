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
