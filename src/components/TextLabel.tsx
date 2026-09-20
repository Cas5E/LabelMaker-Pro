import { FitText } from './FitText'

/** Simpel tekstlabel: dunne zwarte rand, dikke tekst, auto-schaal. */
export interface TextLabelProps {
  title: string
  body?: string | null
  widthMm?: number
  heightMm?: number
}

export function TextLabel({
  title,
  body,
  widthMm = 100,
  heightMm = 25,
}: TextLabelProps) {
  const padX = Math.max(1.5, widthMm * 0.035)
  const padY = Math.max(1.0, heightMm * 0.14)
  const textW = widthMm - padX * 2
  const innerH = heightMm - padY * 2
  const hasBody = Boolean(body?.trim())
  const titleH = hasBody ? innerH * 0.58 : innerH
  const bodyH = innerH * 0.38
  const titleText = (title || '').trim() || '—'
  // Lange titels mogen over 2 regels; korte op 1
  const titleLines = titleText.length > 28 || (titleText.length > 18 && widthMm < 120) ? 2 : 1

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
        padding: `${padY}mm ${padX}mm`,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <FitText
        text={titleText}
        widthMm={textW}
        heightMm={titleH}
        maxMm={Math.min(heightMm * 0.5, widthMm * 0.11)}
        minMm={1.8}
        maxLines={titleLines}
        fontWeight={700}
        color="#000"
        align="left"
      />
      {hasBody ? (
        <FitText
          text={body!.trim()}
          widthMm={textW}
          heightMm={bodyH}
          maxMm={Math.min(heightMm * 0.28, widthMm * 0.065)}
          minMm={1.4}
          maxLines={2}
          fontWeight={600}
          color="#000"
          align="left"
        />
      ) : null}
    </div>
  )
}
