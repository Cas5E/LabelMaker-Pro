import type { SizePreset } from './types'

export const SIZE_PRESETS: SizePreset[] = [
  { label: '32A 5G6 · Ø20,1 mm (75×63 rondtrek)', w: 75, h: 63, kinds: ['cable'] },
  { label: 'Groot 50×35 (Schuko, Powercon)', w: 50, h: 35, kinds: ['cable'] },
  { label: 'Middel 50×25', w: 50, h: 25, kinds: ['cable'] },
  { label: 'Smal 50×20 (XLR, signaal)', w: 50, h: 20, kinds: ['cable'] },
  { label: 'Mini 40×15 (dun kabeltje)', w: 40, h: 15, kinds: ['cable'] },
  { label: 'Flightcase half A4 (200×140)', w: 200, h: 140, kinds: ['flightcase'] },
  { label: 'Flightcase / bak kwart A4 (200×70)', w: 200, h: 70, kinds: ['flightcase', 'bin'] },
  { label: 'Bak tekst 55×15 mm (alleen tekst)', w: 55, h: 15, kinds: ['bin'] },
  { label: 'Tekst strip 270×32 (standaard, volle breedte)', w: 270, h: 32, kinds: ['text'] },
  { label: 'Tekst strip 200×30', w: 200, h: 30, kinds: ['text'] },
  { label: 'Tekst breed 140×30', w: 140, h: 30, kinds: ['text'] },
]

/** Lettertypes voor tekstlabels (print-vriendelijk). */
export const FONT_OPTIONS: { id: string; label: string; css: string }[] = [
  { id: 'arial', label: 'Arial', css: 'Arial, Helvetica, sans-serif' },
  { id: 'helvetica', label: 'Helvetica', css: 'Helvetica, Arial, sans-serif' },
  { id: 'ibm-plex', label: 'IBM Plex Sans', css: "'IBM Plex Sans', Arial, sans-serif" },
  { id: 'inter', label: 'Inter', css: 'Inter, Arial, sans-serif' },
  { id: 'roboto', label: 'Roboto', css: 'Roboto, Arial, sans-serif' },
  { id: 'verdana', label: 'Verdana', css: 'Verdana, Geneva, sans-serif' },
  { id: 'trebuchet', label: 'Trebuchet MS', css: "'Trebuchet MS', Arial, sans-serif" },
  { id: 'georgia', label: 'Georgia', css: 'Georgia, Times, serif' },
  { id: 'times', label: 'Times New Roman', css: "'Times New Roman', Times, serif" },
  { id: 'courier', label: 'Courier New', css: "'Courier New', Courier, monospace" },
  { id: 'plex-mono', label: 'IBM Plex Mono', css: "'IBM Plex Mono', monospace" },
]

export function fontCss(id?: string | null) {
  return FONT_OPTIONS.find((f) => f.id === id)?.css ?? FONT_OPTIONS[0].css
}
