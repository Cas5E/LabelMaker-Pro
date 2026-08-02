export type LabelKind = 'cable' | 'flightcase' | 'bin'

export interface Preset {
  id: string
  label: string
  color: string
  textColor: string
  sortOrder: number
  widthMm: number
  heightMm: number
  kind: LabelKind
  subtitle: string | null
  qrPayload?: string | null
  qrDataUrl?: string | null
  location?: string | null
}

export interface MeterColor {
  id: string
  label: string
  color: string
  textColor: string
}

export interface BatchTemplate {
  id: string
  name: string
  createdAt: string
  items: {
    label: string
    color: string
    textColor: string
    qty: number
    widthMm: number
    heightMm: number
    kind: LabelKind
    subtitle: string | null
    qrDataUrl?: string | null
    location?: string | null
  }[]
}

export interface Profile {
  logoDataUrl: string | null
  companyTel: string
  companyWeb: string
  gapMm: number
  showCutMarks: boolean
}

export interface Bin {
  id: string
  code: string
  name: string
  contents: string
  location: string
  qrPayload: string
  qrDataUrl: string | null
  photoDataUrl: string | null
  rentmanEquipmentId?: number | null
  widthMm: number
  heightMm: number
  createdAt: string
  updatedAt: string
}

export interface RentmanFolder {
  id: number
  name: string
  path: string
  parentId: number | null
}

export interface RentmanEquipmentOption {
  id: number
  name: string
  code: string
  hasImage: boolean
  qr: string
  location: string
}

export interface AppState {
  profile: Profile
  presets: Preset[]
  meterColors: MeterColor[]
  templates: BatchTemplate[]
  bins: Bin[]
  nextBinCode: string
}

export interface LabelItem {
  label: string
  color: string
  textColor: string
  widthMm: number
  heightMm: number
  kind: LabelKind
  subtitle: string | null
  contents?: string | null
  qrDataUrl?: string | null
  photoDataUrl?: string | null
  location?: string | null
}

export interface PrintPageData {
  widthMm: number
  heightMm: number
  cols: number
  rows: number
  gapMm: number
  kind: LabelKind
  items: LabelItem[]
}

export interface SizePreset {
  label: string
  w: number
  h: number
  kinds?: LabelKind[]
}
