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
  color?: string
  letterSpacing?: string
  fontFamily?: string
  className?: string
  style?: CSSProperties
  align?: 'center' | 'left'
}

/**
 * Berekent font-size uit breedte/hoogte/tekstlengte zodat het past — geen ellipsis.
 * Bold Arial ≈ 0.62em per teken; wrapping mag over maxLines.
 */
function fitFontMm(
  text: string,
  widthMm: number,
  heightMm: number,
  maxMm: number,
  minMm: number,
  maxLines: number,
): number {
  const t = text.trim()
  if (!t || widthMm <= 0 || heightMm <= 0) return maxMm

  const lineHeight = 1.05
  const charRatio = 0.62 // conservatief voor Arial Black / 900
  const chars = t.length

  // Max per hoogte
  const byHeight = heightMm / (maxLines * lineHeight)

  // Max per breedte: bij N regels is er ~ N * width aan "tekstbreedte"
  const byWidth = (widthMm * maxLines) / (chars * charRatio)

  // Extra: lange woorden moeten in één regelbreedte passen
  const longestWord = Math.max(...t.split(/\s+/).map((w) => w.length), 1)
  const byWord = widthMm / (longestWord * charRatio)

  const size = Math.min(maxMm, byHeight, byWidth, byWord)
  return Math.max(minMm, Number(size.toFixed(2)))
}

export function FitText({
  text,
  widthMm,
  heightMm,
  maxMm,
  minMm = 2.2,
  maxLines = 2,
  fontWeight = 900,
  color = '#0a0f1a',
  letterSpacing = 'normal',
  fontFamily = 'Arial, Helvetica, sans-serif',
  className,
  style,
  align = 'center',
}: FitTextProps) {
  const sizeMm = useMemo(
    () => fitFontMm(text, widthMm, heightMm, maxMm, minMm, maxLines),
    [text, widthMm, heightMm, maxMm, minMm, maxLines],
  )

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
          fontFamily,
          color,
          letterSpacing,
          lineHeight: 1.05,
          textAlign: align,
          width: '100%',
          maxHeight: `${heightMm}mm`,
          overflow: 'hidden',
          // Geen ellipsis / line-clamp — tekst is al geschaald om te passen
          whiteSpace: maxLines === 1 ? 'nowrap' : 'normal',
          wordBreak: maxLines === 1 ? 'normal' : 'break-word',
          overflowWrap: maxLines === 1 ? 'normal' : 'anywhere',
        }}
      >
        {text}
      </div>
    </div>
  )
}
