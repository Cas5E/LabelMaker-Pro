import type { LabelItem, LabelKind, PrintPageData } from './types'

/** A4 portrait (standaard) */
export const PAGE_W = 210
export const PAGE_H = 297
/** A4 landscape (tekstlabels) */
export const LANDSCAPE_W = 297
export const LANDSCAPE_H = 210
export const PAGE_MARGIN = 6
export const USABLE_W = PAGE_W - PAGE_MARGIN * 2
export const USABLE_H = PAGE_H - PAGE_MARGIN * 2
export const DEFAULT_GAP = 2

export function isLandscapeKind(kind: LabelKind) {
  return kind === 'text'
}

export function pageSizeFor(kind: LabelKind) {
  if (isLandscapeKind(kind)) {
    return {
      pageW: LANDSCAPE_W,
      pageH: LANDSCAPE_H,
      usableW: LANDSCAPE_W - PAGE_MARGIN * 2,
      usableH: LANDSCAPE_H - PAGE_MARGIN * 2,
      landscape: true,
    }
  }
  return {
    pageW: PAGE_W,
    pageH: PAGE_H,
    usableW: USABLE_W,
    usableH: USABLE_H,
    landscape: false,
  }
}

/** Shelf-packing: verschillende maten op één vel (rij voor rij). */
function packOntoPages(
  items: LabelItem[],
  usableW: number,
  usableH: number,
  gapMm: number,
): LabelItem[][] {
  const pages: LabelItem[][] = []
  let page: LabelItem[] = []
  let x = 0
  let y = 0
  let shelfH = 0

  const flushPage = () => {
    if (page.length) pages.push(page)
    page = []
    x = 0
    y = 0
    shelfH = 0
  }

  for (const item of items) {
    const w = Math.min(item.widthMm, usableW)
    const h = Math.min(item.heightMm, usableH)

    // Nieuwe rij als dit label niet meer naast past
    if (x > 0 && x + w > usableW + 0.01) {
      y += shelfH + gapMm
      x = 0
      shelfH = 0
    }

    // Nieuw vel als dit label niet meer onder past
    if (y > 0 && y + h > usableH + 0.01) {
      flushPage()
    }

    page.push(item)
    shelfH = Math.max(shelfH, h)
    x += w + gapMm
  }
  flushPage()
  return pages
}

function paginateUniform(
  arr: LabelItem[],
  gapMm: number,
): PrintPageData[] {
  const { widthMm, heightMm, kind } = arr[0]
  const page = pageSizeFor(kind)
  const cols = Math.max(1, Math.floor((page.usableW + gapMm) / (widthMm + gapMm)))
  const rows = Math.max(1, Math.floor((page.usableH + gapMm) / (heightMm + gapMm)))
  const perPage = cols * rows
  const result: PrintPageData[] = []
  for (let i = 0; i < arr.length; i += perPage) {
    result.push({
      widthMm,
      heightMm,
      cols,
      rows,
      gapMm,
      kind,
      items: arr.slice(i, i + perPage),
      pageW: page.pageW,
      pageH: page.pageH,
      landscape: page.landscape,
      mixed: false,
    })
  }
  return result
}

export function paginateLabels(labels: LabelItem[], gapMm: number): PrintPageData[] {
  const textItems = labels.filter((l) => l.kind === 'text')
  const otherItems = labels.filter((l) => l.kind !== 'text')

  const result: PrintPageData[] = []

  // Tekstlabels: alle maten samen packen op A4 liggend
  if (textItems.length) {
    const page = pageSizeFor('text')
    const packed = packOntoPages(textItems, page.usableW, page.usableH, gapMm)
    for (const items of packed) {
      const maxW = Math.max(...items.map((i) => i.widthMm))
      const maxH = Math.max(...items.map((i) => i.heightMm))
      result.push({
        widthMm: maxW,
        heightMm: maxH,
        cols: 1,
        rows: 1,
        gapMm,
        kind: 'text',
        items,
        pageW: page.pageW,
        pageH: page.pageH,
        landscape: true,
        mixed: true,
      })
    }
  }

  // Overige kinds: per formaat een uniform grid (zoals voorheen)
  const groups = new Map<string, LabelItem[]>()
  for (const l of otherItems) {
    const key = `${l.kind}:${l.widthMm}x${l.heightMm}`
    const arr = groups.get(key) ?? []
    arr.push(l)
    groups.set(key, arr)
  }
  for (const [, arr] of groups) {
    result.push(...paginateUniform(arr, gapMm))
  }

  return result
}

export function capacityFor(
  widthMm: number,
  heightMm: number,
  gapMm: number,
  kind: LabelKind = 'cable',
) {
  const page = pageSizeFor(kind)
  const cols = Math.max(1, Math.floor((page.usableW + gapMm) / (widthMm + gapMm)))
  const rows = Math.max(1, Math.floor((page.usableH + gapMm) / (heightMm + gapMm)))
  return { cols, rows, perPage: cols * rows }
}
