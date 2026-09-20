import { FitText } from './FitText'
import { fontCss } from '../lib/defaults'

/** Simpel tekstlabel: dunne zwarte rand, typografie kiesbaar. */
export interface TextLabelProps {
  title: string
  body?: string | null
  widthMm?: number
  heightMm?: number
  fontFamily?: string
  fontBold?: boolean
  fontItalic?: boolean
}

/** Schat of 1 regel past met bruikbare fontgrootte; anders 2 regels. */
function pickLines(text: string, widthMm: number, heightMm: number, weight: number) {
  const charRatio = weight >= 800 ? 0.62 : weight >= 600 ? 0.56 : 0.5
  const oneLine = widthMm / (Math.max(text.length, 1) * charRatio)
  const byHeight = heightMm / 1.08
  const oneSize = Math.min(oneLine, byHeight)
  if (oneSize >= heightMm * 0.32 && oneSize >= 2.2) return 1
  return 2
}

export function TextLabel({
  title,
  body,
  widthMm = 100,
  heightMm = 25,
  fontFamily = 'arial',
  fontBold = true,
  fontItalic = false,
}: TextLabelProps) {
  const padX = Math.max(1.2, widthMm * 0.025)
  const padY = Math.max(0.8, heightMm * 0.08)
  const textW = widthMm - padX * 2
  const innerH = heightMm - padY * 2
  const hasBody = Boolean(body?.trim())
  const titleText = (title || '').trim() || '—'
  const bodyText = hasBody ? body!.trim() : ''
  const family = fontCss(fontFamily)
  const titleWeight = fontBold ? 700 : 400
  const bodyWeight = fontBold ? 600 : 400
  const style = fontItalic ? ('italic' as const) : ('normal' as const)

  const titleH = hasBody ? innerH * 0.68 : innerH
  const bodyH = hasBody ? innerH * 0.26 : 0
  const gap = hasBody ? innerH * 0.06 : 0

  const titleLines = pickLines(titleText, textW, titleH, titleWeight)
  const bodyLines = hasBody ? pickLines(bodyText, textW, bodyH, bodyWeight) : 1
  const titleMax = titleH / 1.05
  const bodyMax = Math.min(bodyH / 1.05, titleMax * 0.55)

  return (
    <div
      className="label-tile text-label"
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        boxSizing: 'border-box',
        border: '0.35mm solid #000',
        outline: 'none',
        backgroundColor: '#fff',
        overflow: 'hidden',
        fontFamily: family,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: `${gap}mm`,
        padding: `${padY}mm ${padX}mm`,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <FitText
        text={titleText}
        widthMm={textW}
        heightMm={titleH}
        maxMm={titleMax}
        minMm={1.6}
        maxLines={titleLines}
        fontWeight={titleWeight}
        fontStyle={style}
        fontFamily={family}
        color="#000"
        align="left"
      />
      {hasBody ? (
        <FitText
          text={bodyText}
          widthMm={textW}
          heightMm={bodyH}
          maxMm={bodyMax}
          minMm={1.2}
          maxLines={bodyLines}
          fontWeight={bodyWeight}
          fontStyle={style}
          fontFamily={family}
          color="#000"
          align="left"
        />
      ) : null}
    </div>
  )
}
