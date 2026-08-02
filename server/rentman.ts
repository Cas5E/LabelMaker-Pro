import './env.ts'

const BASE = (process.env.RENTMAN_API_BASE || 'https://api.rentman.net').replace(/\/$/, '')

export function rentmanConfigured() {
  return Boolean(process.env.RENTMAN_API_KEY)
}

async function rentmanFetch(path: string, init?: RequestInit) {
  const key = process.env.RENTMAN_API_KEY
  if (!key) throw new Error('RENTMAN_API_KEY ontbreekt in .env')

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${key}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Rentman ${res.status}: ${text.slice(0, 200) || res.statusText}`)
  }
  return res
}

async function rentmanJson<T = unknown>(path: string): Promise<T> {
  const res = await rentmanFetch(path)
  return res.json() as Promise<T>
}

type Collection<T> = {
  data?: T[]
  itemCount?: number
  limit?: number
  offset?: number
}

export type RentmanFolder = {
  id: number
  name: string
  parent: string | null
  path: string
  itemtype: string
}

export type RentmanEquipment = {
  id: number
  name: string
  displayname?: string
  code: string
  folder: string | null
  image: string | null
  qrcodes: string
  qrcodes_of_serial_numbers?: string
  location_in_warehouse?: string
  internal_remark?: string
  external_remark?: string
  in_archive?: boolean
}

function folderIdFromRef(ref: string | null | undefined): number | null {
  if (!ref) return null
  const m = String(ref).match(/\/folders\/(\d+)/)
  return m ? Number(m[1]) : null
}

function fileIdFromRef(ref: string | null | undefined): number | null {
  if (!ref) return null
  const m = String(ref).match(/\/files\/(\d+)/)
  return m ? Number(m[1]) : null
}

function firstQr(qrcodes: string | null | undefined): string {
  if (!qrcodes?.trim()) return ''
  return qrcodes
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)[0] ?? ''
}

/** Alle equipment-folders, gesorteerd op pad. */
export async function listEquipmentFolders(): Promise<
  { id: number; name: string; path: string; parentId: number | null }[]
> {
  const all: RentmanFolder[] = []
  let offset = 0
  const limit = 100
  for (;;) {
    const page = await rentmanJson<Collection<RentmanFolder>>(
      `/folders?itemtype=equipment&limit=${limit}&offset=${offset}`,
    )
    const chunk = page.data ?? []
    all.push(...chunk)
    if (chunk.length < limit) break
    offset += limit
    if (offset > 5000) break
  }

  return all
    .map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path || f.name,
      parentId: folderIdFromRef(f.parent),
    }))
    .sort((a, b) => a.path.localeCompare(b.path, 'nl'))
}

/** Producten in een folder (categorie). */
export async function listEquipmentInFolder(folderId: number): Promise<
  {
    id: number
    name: string
    code: string
    hasImage: boolean
    qr: string
    location: string
  }[]
> {
  const all: RentmanEquipment[] = []
  let offset = 0
  const limit = 100
  for (;;) {
    const page = await rentmanJson<Collection<RentmanEquipment>>(
      `/equipment?folder=/folders/${folderId}&limit=${limit}&offset=${offset}`,
    )
    const chunk = page.data ?? []
    all.push(...chunk)
    if (chunk.length < limit) break
    offset += limit
    if (offset > 5000) break
  }

  return all
    .filter((e) => !e.in_archive)
    .map((e) => ({
      id: e.id,
      name: e.name || e.displayname || e.code,
      code: e.code || String(e.id),
      hasImage: Boolean(e.image),
      qr: firstQr(e.qrcodes),
      location: e.location_in_warehouse?.trim() || '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'nl'))
}

async function imageToDataUrl(fileId: number): Promise<string | null> {
  const meta = await rentmanJson<{ data: { url?: string; proxy_url?: string; type?: string; image?: boolean } }>(
    `/files/${fileId}`,
  )
  const file = meta.data
  if (!file?.image && !(file?.type ?? '').startsWith('image/')) return null
  const src = file.url || file.proxy_url
  if (!src) return null

  const imgRes = await fetch(src)
  if (!imgRes.ok) return null
  const buf = Buffer.from(await imgRes.arrayBuffer())
  const mime = imgRes.headers.get('content-type') || file.type || 'image/jpeg'
  if (buf.byteLength > 4_500_000) return null
  return `data:${mime};base64,${buf.toString('base64')}`
}

/** Volledige productdetails voor label-import. */
export async function getEquipmentForLabel(equipmentId: number) {
  const meta = await rentmanJson<{ data: RentmanEquipment }>(`/equipment/${equipmentId}`)
  const e = meta.data
  const fileId = fileIdFromRef(e.image)
  let photoDataUrl: string | null = null
  if (fileId) {
    try {
      photoDataUrl = await imageToDataUrl(fileId)
    } catch {
      photoDataUrl = null
    }
  }

  const qr = firstQr(e.qrcodes) || firstQr(e.qrcodes_of_serial_numbers) || e.code || String(e.id)

  return {
    rentmanId: e.id,
    name: e.name || e.displayname || e.code,
    code: e.code || String(e.id),
    qrPayload: qr,
    location: e.location_in_warehouse?.trim() || '',
    contents: [e.code, e.external_remark?.trim() || e.internal_remark?.trim()]
      .filter(Boolean)
      .join(' · '),
    photoDataUrl,
    folderId: folderIdFromRef(e.folder),
  }
}
