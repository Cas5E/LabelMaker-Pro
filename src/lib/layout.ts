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

export function paginateLabels(labels: LabelItem[], gapMm: number): PrintPageData[] {
  const groups = new Map<string, LabelItem[]>()
  for (const l of labels) {
    const key = `${l.kind}:${l.widthMm}x${l.heightMm}`
    const arr = groups.get(key) ?? []
    arr.push(l)
    groups.set(key, arr)
  }

  const result: PrintPageData[] = []
  for (const [, arr] of groups) {
    const { widthMm, heightMm, kind } = arr[0]
    const page = pageSizeFor(kind)
    const cols = Math.max(1, Math.floor((page.usableW + gapMm) / (widthMm + gapMm)))
    const rows = Math.max(1, Math.floor((page.usableH + gapMm) / (heightMm + gapMm)))
    const perPage = cols * rows
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
      })
    }
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
