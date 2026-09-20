import { FitText } from './FitText'

/** Vrij tekstlabel — liggend A4 (1 of 2 per vel). */
export interface TextLabelProps {
  title: string
  body?: string | null
  logoUrl: string | null
  companyTel?: string
  companyWeb?: string
  widthMm?: number
  heightMm?: number
}

export function TextLabel({
  title,
  body,
  logoUrl,
  companyTel = '',
  companyWeb = '',
  widthMm = 140,
  heightMm = 198,
}: TextLabelProps) {
  const pad = Math.min(widthMm, heightMm) * 0.06
  const accentW = Math.max(2.5, widthMm * 0.018)
  const titleH = heightMm * (body?.trim() ? 0.28 : 0.4)
  const bodyH = heightMm * 0.28
  const textW = widthMm - accentW - pad * 2
  const footer =
    [companyTel.trim(), companyWeb.trim()].filter(Boolean).join('  ·  ') || null

  return (
    <div
      className="label-tile text-label"
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        boxSizing: 'border-box',
        outline: '0.35mm solid #0a0f1a',
        outlineOffset: '-0.35mm',
        border: 'none',
        backgroundColor: '#fff',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Arial, Helvetica, sans-serif',
        display: 'flex',
        flexDirection: 'row',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <div
        aria-hidden
        style={{
          width: `${accentW}mm`,
          height: '100%',
          flexShrink: 0,
          background: 'linear-gradient(180deg, #22d3ee 0%, #0a2540 100%)',
        }}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: `${pad}mm ${pad}mm ${pad * 0.85}mm ${pad}mm`,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            minHeight: `${Math.max(8, heightMm * 0.1)}mm`,
            marginBottom: `${heightMm * 0.04}mm`,
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              style={{
                maxHeight: `${Math.max(10, heightMm * 0.12)}mm`,
                maxWidth: `${widthMm * 0.35}mm`,
                objectFit: 'contain',
              }}
            />
          ) : null}
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: `${heightMm * 0.025}mm`,
            minHeight: 0,
          }}
        >
          <FitText
            text={title.trim() || '—'}
            widthMm={textW}
            heightMm={titleH}
            maxMm={Math.min(widthMm * 0.12, heightMm * 0.14)}
            minMm={Math.max(4, heightMm * 0.035)}
            maxLines={3}
            fontWeight={900}
            color="#0a0f1a"
            letterSpacing="-0.02em"
            align="left"
          />
          {body?.trim() ? (
            <FitText
              text={body.trim()}
              widthMm={textW}
              heightMm={bodyH}
              maxMm={Math.min(widthMm * 0.055, heightMm * 0.07)}
              minMm={Math.max(2.8, heightMm * 0.025)}
              maxLines={4}
              fontWeight={600}
              color="#334155"
              align="left"
            />
          ) : null}
        </div>

        {footer ? (
          <div
            style={{
              marginTop: `${heightMm * 0.03}mm`,
              paddingTop: `${heightMm * 0.025}mm`,
              borderTop: '0.25mm solid #cbd5e1',
              fontSize: `${Math.max(2.4, heightMm * 0.028)}mm`,
              fontWeight: 600,
              color: '#64748b',
              letterSpacing: '0.02em',
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
