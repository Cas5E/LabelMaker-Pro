import { FitText } from './FitText'

/** Simpel tekstlabel: dunne zwarte rand, dikke tekst, geen logo/graphics. */
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
  const padX = Math.max(1.5, widthMm * 0.04)
  const padY = Math.max(1.2, heightMm * 0.18)
  const textW = widthMm - padX * 2
  const hasBody = Boolean(body?.trim())
  const titleH = hasBody ? (heightMm - padY * 2) * 0.58 : heightMm - padY * 2
  const bodyH = (heightMm - padY * 2) * 0.38

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
        text={title.trim() || '—'}
        widthMm={textW}
        heightMm={titleH}
        maxMm={Math.min(heightMm * 0.55, widthMm * 0.12)}
        minMm={Math.max(2.5, heightMm * 0.28)}
        maxLines={1}
        fontWeight={700}
        color="#000"
        align="left"
      />
      {hasBody ? (
        <FitText
          text={body!.trim()}
          widthMm={textW}
          heightMm={bodyH}
          maxMm={Math.min(heightMm * 0.32, widthMm * 0.07)}
          minMm={Math.max(1.8, heightMm * 0.16)}
          maxLines={1}
          fontWeight={600}
          color="#000"
          align="left"
        />
      ) : null}
    </div>
  )
}
