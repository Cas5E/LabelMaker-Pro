import type { LabelItem, PrintPageData } from './types'

/** A4 with safe margin for most consumer printers */
export const PAGE_W = 210
export const PAGE_H = 297
export const PAGE_MARGIN = 6
export const USABLE_W = PAGE_W - PAGE_MARGIN * 2
export const USABLE_H = PAGE_H - PAGE_MARGIN * 2
export const DEFAULT_GAP = 2

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
    const cols = Math.max(1, Math.floor((USABLE_W + gapMm) / (widthMm + gapMm)))
    const rows = Math.max(1, Math.floor((USABLE_H + gapMm) / (heightMm + gapMm)))
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
      })
    }
  }
  return result
}

export function capacityFor(widthMm: number, heightMm: number, gapMm: number) {
  const cols = Math.max(1, Math.floor((USABLE_W + gapMm) / (widthMm + gapMm)))
  const rows = Math.max(1, Math.floor((USABLE_H + gapMm) / (heightMm + gapMm)))
  return { cols, rows, perPage: cols * rows }
}
