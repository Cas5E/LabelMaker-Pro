import type { CSSProperties } from 'react'
import { FitText } from './FitText'

function StepAccent({
  size,
  variant,
  dark = '#0a2540',
  accent = '#22d3ee',
}: {
  size: number
  variant: 'tl' | 'tr' | 'br'
  dark?: string
  accent?: string
}) {
  const flip: Record<typeof variant, string> = {
    tl: '',
    tr: 'translate(100,0) scale(-1,1)',
    br: 'translate(100,100) scale(-1,-1)',
  }
  const skew = 0.577
  const bar = (x: number, y: number, w: number, h: number, color: string) => {
    const dx = h * skew
    const pts = [
      `${x + dx},${y}`,
      `${x + dx + w},${y}`,
      `${x + w},${y + h}`,
      `${x},${y + h}`,
    ].join(' ')
    return <polygon points={pts} fill={color} />
  }

  return (
    <svg
      width={`${size}mm`}
      height={`${size}mm`}
      viewBox="0 0 100 100"
      style={{ display: 'block', pointerEvents: 'none' }}
      aria-hidden
    >
      <g transform={flip[variant]}>
        {bar(0, 5, 34, 18, dark)}
        {bar(10, 30, 34, 18, accent)}
        {bar(22, 55, 34, 18, dark)}
      </g>
    </svg>
  )
}

export interface FlightCaseLabelProps {
  label: string
  subtitle?: string | null
  logoUrl: string | null
  companyTel?: string | null
  companyWeb?: string | null
  widthMm?: number
  heightMm?: number
}

export function FlightCaseLabel({
  label,
  subtitle,
  logoUrl,
  companyTel,
  companyWeb,
  widthMm = 200,
  heightMm = 140,
}: FlightCaseLabelProps) {
  const barH = Math.max(1.6, heightMm * 0.022)
  const padX = widthMm * 0.05
  const logoRowH = heightMm * 0.32
  const footerH = heightMm * 0.14
  const cornerSize = Math.min(widthMm, heightMm) * 0.22

  const fieldLabelSize = Math.min(widthMm * 0.028, heightMm * 0.042)
  const productValueSize = Math.min(widthMm * 0.052, heightMm * 0.08)
  const contentValueSize = Math.min(widthMm * 0.065, heightMm * 0.13)
  const footerSize = Math.min(widthMm * 0.021, heightMm * 0.03)

  const fieldLabelStyle: CSSProperties = {
    fontFamily: '"IBM Plex Sans", sans-serif',
    fontSize: `${fieldLabelSize}mm`,
    fontWeight: 500,
    color: '#0a2540',
  }
  const bar = <div style={{ height: `${barH}mm`, background: '#0a0f1a', width: '100%' }} />

  return (
    <div
      className="label-tile"
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        background: '#fff',
        border: '0.3mm solid #0a0f1a',
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateRows: `${logoRowH}mm ${barH}mm 1fr ${barH}mm 1.7fr ${footerH}mm`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
        <StepAccent size={cornerSize} variant="tl" />
      </div>
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 0 }}>
        <StepAccent size={cornerSize} variant="tr" />
      </div>
      <div style={{ position: 'absolute', bottom: 0, right: 0, zIndex: 0 }}>
        <StepAccent size={cornerSize * 1.15} variant="br" />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${heightMm * 0.02}mm ${cornerSize + 4}mm`,
          minHeight: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            style={{
              maxHeight: `${logoRowH * 0.9}mm`,
              maxWidth: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <div
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: `${logoRowH * 0.28}mm`,
              fontWeight: 800,
              color: '#0a2540',
              letterSpacing: '0.04em',
            }}
          >
            LOGO
          </div>
        )}
      </div>

      {bar}

      <div
        style={{
          padding: `0 ${padX}mm`,
          display: 'flex',
          alignItems: 'center',
          gap: `${widthMm * 0.02}mm`,
          minHeight: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span style={fieldLabelStyle}>Product:</span>
        <FitText
          text={label}
          widthMm={widthMm - padX * 2 - widthMm * 0.18}
          heightMm={productValueSize * 1.35}
          maxMm={productValueSize}
          minMm={Math.max(2, productValueSize * 0.4)}
          maxLines={1}
          fontWeight={700}
          color="#0a2540"
          fontFamily="'Helvetica Neue', Arial, sans-serif"
          align="left"
          style={{ flex: 1, minWidth: 0 }}
        />
      </div>

      {bar}

      <div
        style={{
          padding: `${heightMm * 0.02}mm ${padX}mm 0 ${padX}mm`,
          display: 'flex',
          flexDirection: 'column',
          gap: `${heightMm * 0.015}mm`,
          minHeight: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span style={fieldLabelStyle}>Inhoud:</span>
        <FitText
          text={subtitle || ''}
          widthMm={widthMm - padX * 2}
          heightMm={Math.max(contentValueSize * 1.8, heightMm * 0.22)}
          maxMm={contentValueSize}
          minMm={Math.max(2.2, contentValueSize * 0.35)}
          maxLines={2}
          fontWeight={700}
          color="#0a2540"
          fontFamily="'Helvetica Neue', Arial, sans-serif"
          align="left"
        />
      </div>

      <div
        style={{
          padding: `0 ${cornerSize * 1.3}mm 0 ${padX}mm`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: `${widthMm * 0.04}mm`,
          fontFamily: '"IBM Plex Sans", sans-serif',
          fontSize: `${footerSize}mm`,
          color: '#0a2540',
          minHeight: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {companyWeb && (
          <span>
            <strong>Website:</strong> {companyWeb}
          </span>
        )}
        {companyTel && (
          <span>
            <strong>Tel:</strong> {companyTel}
          </span>
        )}
      </div>
    </div>
  )
}
