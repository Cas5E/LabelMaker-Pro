import { computeFitFontMm, FitText } from './FitText'
import { fontCss } from '../lib/defaults'

/** Simpel tekstlabel: dunne zwarte rand, typografie per regel. */
export interface TextLabelProps {
  title: string
  body?: string | null
  widthMm?: number
  heightMm?: number
  fontFamily?: string
  titleBold?: boolean
  titleItalic?: boolean
  bodyBold?: boolean
  bodyItalic?: boolean
  /** Gedeelde grootte over alle labels op hetzelfde vel */
  forcedTitleMm?: number
  forcedBodyMm?: number
}

export function textLabelInner(widthMm: number, heightMm: number, hasBody: boolean) {
  const padX = Math.max(2.5, widthMm * 0.02)
  const padY = Math.max(1.8, heightMm * 0.12)
  const textW = widthMm - padX * 2
  const innerH = heightMm - padY * 2
  const titleH = hasBody ? innerH * 0.62 : innerH
  const bodyH = hasBody ? innerH * 0.28 : 0
  const gap = hasBody ? innerH * 0.1 : 0
  return { padX, padY, textW, titleH, bodyH, gap, titleMax: titleH / 1.08, bodyMax: bodyH / 1.08 }
}

function pickLines(text: string, widthMm: number, heightMm: number, weight: number) {
  const charRatio = weight >= 800 ? 0.62 : weight >= 600 ? 0.56 : 0.5
  const oneLine = widthMm / (Math.max(text.length, 1) * charRatio)
  const byHeight = heightMm / 1.08
  const oneSize = Math.min(oneLine, byHeight)
  if (oneSize >= heightMm * 0.36 && oneSize >= 2.4) return 1
  return 2
}

/** Kleinste titel-/body-grootte die voor alle items past (uniforme look). */
export function sharedTextFontSizes(
  items: {
    label: string
    subtitle?: string | null
    widthMm: number
    heightMm: number
    titleBold?: boolean
    bodyBold?: boolean
  }[],
) {
  let titleMm = Infinity
  let bodyMm = Infinity
  for (const item of items) {
    const hasBody = Boolean(item.subtitle?.trim())
    const m = textLabelInner(item.widthMm, item.heightMm, hasBody)
    const tw = item.titleBold !== false ? 700 : 400
    const bw = item.bodyBold ? 600 : 400
    const title = (item.label || '').trim() || '—'
    const titleLines = pickLines(title, m.textW, m.titleH, tw)
    // Cap max zodat korte teksten niet “uit hun dak” gaan
    const titleCap = Math.min(m.titleMax, item.heightMm * 0.42, 7.5)
    titleMm = Math.min(
      titleMm,
      computeFitFontMm(title, m.textW, m.titleH, titleCap, 1.6, titleLines, tw),
    )
    if (hasBody) {
      const body = item.subtitle!.trim()
      const bodyLines = pickLines(body, m.textW, m.bodyH, bw)
      const bodyCap = Math.min(m.bodyMax, titleCap * 0.55, 4.2)
      bodyMm = Math.min(
        bodyMm,
        computeFitFontMm(body, m.textW, m.bodyH, bodyCap, 1.2, bodyLines, bw),
      )
    }
  }
  return {
    titleMm: Number.isFinite(titleMm) ? titleMm : 5,
    bodyMm: Number.isFinite(bodyMm) ? bodyMm : 2.8,
  }
}

export function TextLabel({
  title,
  body,
  widthMm = 270,
  heightMm = 32,
  fontFamily = 'arial',
  titleBold = true,
  titleItalic = false,
  bodyBold = false,
  bodyItalic = false,
  forcedTitleMm,
  forcedBodyMm,
}: TextLabelProps) {
  const hasBody = Boolean(body?.trim())
  const titleText = (title || '').trim() || '—'
  const bodyText = hasBody ? body!.trim() : ''
  const family = fontCss(fontFamily)
  const titleWeight = titleBold ? 700 : 400
  const bodyWeight = bodyBold ? 600 : 400
  const m = textLabelInner(widthMm, heightMm, hasBody)

  const titleLines = pickLines(titleText, m.textW, m.titleH, titleWeight)
  const bodyLines = hasBody ? pickLines(bodyText, m.textW, m.bodyH, bodyWeight) : 1
  const titleCap = Math.min(m.titleMax, heightMm * 0.42, 7.5)
  const bodyCap = Math.min(m.bodyMax, titleCap * 0.55, 4.2)

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
        gap: `${m.gap}mm`,
        padding: `${m.padY}mm ${m.padX}mm`,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <FitText
        text={titleText}
        widthMm={m.textW}
        heightMm={m.titleH}
        maxMm={titleCap}
        minMm={1.6}
        maxLines={titleLines}
        fontWeight={titleWeight}
        fontStyle={titleItalic ? 'italic' : 'normal'}
        fontFamily={family}
        color="#000"
        align="left"
        forcedSizeMm={forcedTitleMm}
      />
      {hasBody ? (
        <FitText
          text={bodyText}
          widthMm={m.textW}
          heightMm={m.bodyH}
          maxMm={bodyCap}
          minMm={1.2}
          maxLines={bodyLines}
          fontWeight={bodyWeight}
          fontStyle={bodyItalic ? 'italic' : 'normal'}
          fontFamily={family}
          color="#000"
          align="left"
          forcedSizeMm={forcedBodyMm}
        />
      ) : null}
    </div>
  )
}
