import { useMemo, type CSSProperties } from 'react'

interface FitTextProps {
  text: string
  /** Beschikbare breedte van het tekstvak in mm */
  widthMm: number
  /** Beschikbare hoogte van het tekstvak in mm */
  heightMm: number
  maxMm: number
  minMm?: number
  maxLines?: number
  fontWeight?: number | string
  fontStyle?: 'normal' | 'italic'
  color?: string
  letterSpacing?: string
  fontFamily?: string
  className?: string
  style?: CSSProperties
  align?: 'center' | 'left'
}

/**
 * Berekent font-size zodat tekst past — krimpt onder minMm als dat nodig is.
 * Bold Arial ≈ 0.55–0.62em per teken afhankelijk van gewicht.
 */
export function computeFitFontMm(
  text: string,
  widthMm: number,
  heightMm: number,
  maxMm: number,
  minMm: number,
  maxLines: number,
  fontWeight: number | string,
): number {
  const t = text.trim()
  if (!t || widthMm <= 0 || heightMm <= 0) return maxMm

  const weight = typeof fontWeight === 'number' ? fontWeight : parseInt(String(fontWeight), 10) || 700
  const lineHeight = 1.08
  const charRatio = weight >= 800 ? 0.62 : weight >= 600 ? 0.56 : 0.5
  const chars = t.length

  const byHeight = heightMm / (maxLines * lineHeight)
  const byWidth = (widthMm * maxLines) / (chars * charRatio)
  const longestWord = Math.max(...t.split(/\s+/).map((w) => w.length), 1)
  const byWord =
    maxLines === 1
      ? widthMm / (longestWord * charRatio)
      : widthMm / (Math.min(longestWord, chars) * charRatio * 0.85)

  let size = Math.min(maxMm, byHeight, byWidth, byWord)
  if (size < minMm) size = Math.max(1.0, size)
  return Number(size.toFixed(2))
}

export function FitText({
  text,
  widthMm,
  heightMm,
  maxMm,
  minMm = 2.2,
  maxLines = 2,
  fontWeight = 900,
  fontStyle = 'normal',
  color = '#0a0f1a',
  letterSpacing = 'normal',
  fontFamily = 'Arial, Helvetica, sans-serif',
  className,
  style,
  align = 'center',
  /** Vaste mm-grootte (gedeeld over labels op één vel) */
  forcedSizeMm,
}: FitTextProps & { forcedSizeMm?: number }) {
  const sizeMm = useMemo(() => {
    if (forcedSizeMm != null && forcedSizeMm > 0) return forcedSizeMm
    return computeFitFontMm(text, widthMm, heightMm, maxMm, minMm, maxLines, fontWeight)
  }, [text, widthMm, heightMm, maxMm, minMm, maxLines, fontWeight, forcedSizeMm])

  const singleLine = maxLines === 1

  return (
    <div
      className={className}
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        height: `${heightMm}mm`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        ...style,
      }}
    >
      <div
        style={{
          fontSize: `${sizeMm}mm`,
          fontWeight,
          fontStyle,
          fontFamily,
          color,
          letterSpacing,
          lineHeight: 1.08,
          textAlign: align,
          width: '100%',
          maxHeight: `${heightMm}mm`,
          overflow: 'hidden',
          whiteSpace: singleLine ? 'nowrap' : 'normal',
          wordBreak: singleLine ? 'normal' : 'break-word',
          overflowWrap: singleLine ? 'normal' : 'anywhere',
        }}
      >
        {text}
      </div>
    </div>
  )
}
