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
]
