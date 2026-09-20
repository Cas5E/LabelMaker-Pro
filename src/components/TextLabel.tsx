import { FitText } from './FitText'

/** Simpel tekstlabel: dunne zwarte rand, dikke tekst, vult het vak. */
export interface TextLabelProps {
  title: string
  body?: string | null
  widthMm?: number
  heightMm?: number
}

/** Schat of 1 regel past met bruikbare fontgrootte; anders 2 regels. */
function pickLines(text: string, widthMm: number, heightMm: number, weight: number) {
  const charRatio = weight >= 800 ? 0.62 : weight >= 600 ? 0.56 : 0.5
  const oneLine = widthMm / (Math.max(text.length, 1) * charRatio)
  const byHeight = heightMm / 1.08
  const oneSize = Math.min(oneLine, byHeight)
  // 1 regel als die nog “leesbaar groot” is t.o.v. de vakhoogte
  if (oneSize >= heightMm * 0.32 && oneSize >= 2.2) return 1
  return 2
}

export function TextLabel({
  title,
  body,
  widthMm = 100,
  heightMm = 25,
}: TextLabelProps) {
  const padX = Math.max(1.2, widthMm * 0.025)
  const padY = Math.max(0.8, heightMm * 0.08)
  const textW = widthMm - padX * 2
  const innerH = heightMm - padY * 2
  const hasBody = Boolean(body?.trim())
  const titleText = (title || '').trim() || '—'
  const bodyText = hasBody ? body!.trim() : ''

  // Titel krijgt het grootste deel; body een strakke tweede regel
  const titleH = hasBody ? innerH * 0.62 : innerH
  const bodyH = hasBody ? innerH * 0.34 : 0
  const gap = hasBody ? innerH * 0.04 : 0

  const titleLines = pickLines(titleText, textW, titleH, 700)
  const bodyLines = hasBody ? pickLines(bodyText, textW, bodyH, 600) : 1

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
        fontFamily: 'Arial, Helvetica, sans-serif',
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
        maxMm={titleH / 1.05}
        minMm={1.6}
        maxLines={titleLines}
        fontWeight={700}
        color="#000"
        align="left"
      />
      {hasBody ? (
        <FitText
          text={bodyText}
          widthMm={textW}
          heightMm={bodyH}
          maxMm={bodyH / 1.05}
          minMm={1.3}
          maxLines={bodyLines}
          fontWeight={600}
          color="#000"
          align="left"
        />
      ) : null}
    </div>
  )
}
