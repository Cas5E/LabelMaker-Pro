export interface CableLabelProps {
  label: string
  color: string
  textColor?: string
  logoUrl: string | null
  widthMm?: number
  heightMm?: number
}

/** Zelfde typografie als het oude LabelMaker Pro-project (Arial Black-achtig). */
const LABEL_FONT = 'Arial, Helvetica, sans-serif'

export function CableLabel({
  label,
  color,
  textColor = '#FFFFFF',
  logoUrl,
  widthMm = 50,
  heightMm = 35,
}: CableLabelProps) {
  const len = label.length
  const barW = Math.min(16, Math.max(8, widthMm * 0.28))
  const repeats = heightMm >= 30 ? 4 : heightMm >= 22 ? 3 : heightMm >= 15 ? 2 : 1
  const slotH = heightMm / repeats
  const baseFont = Math.min(slotH * 0.75, barW * 0.6)
  const shrink = len <= 2 ? 1 : len <= 3 ? 0.82 : len <= 4 ? 0.68 : 0.55
  const fontSize = baseFont * shrink
  const logoRepeats = heightMm >= 30 ? 3 : heightMm >= 20 ? 2 : 1
  const logoMax = Math.max(4, heightMm / (logoRepeats + 0.5))

  return (
    <div
      className="label-tile"
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        display: 'flex',
        border: '0.2mm solid #000',
        boxSizing: 'border-box',
        background: '#fff',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${barW}mm`,
          background: color,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: `${Math.min(1.5, heightMm * 0.05)}mm 0`,
          color: textColor,
          fontWeight: 900,
          fontFamily: LABEL_FONT,
          fontSize: `${fontSize}mm`,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {Array.from({ length: repeats }).map((_, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: `${Math.min(1.5, heightMm * 0.05)}mm ${Math.min(2, widthMm * 0.04)}mm`,
        }}
      >
        {Array.from({ length: logoRepeats }).map((_, i) =>
          logoUrl ? (
            <img
              key={i}
              src={logoUrl}
              alt=""
              style={{ maxHeight: `${logoMax}mm`, maxWidth: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div
              key={i}
              style={{
                fontFamily: LABEL_FONT,
                fontWeight: 800,
                fontSize: `${Math.max(2, heightMm * 0.09)}mm`,
                color: '#94a3b8',
              }}
            >
              logo
            </div>
          ),
        )}
      </div>
    </div>
  )
}
