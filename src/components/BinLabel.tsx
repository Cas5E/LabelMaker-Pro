/** Magazijn bak-label — 200×70 mm.
 *  [blauwe rand] [foto?] [NAAM + info gecentreerd] [QR]
 */

export interface BinLabelProps {
  code: string
  name: string
  contents?: string | null
  location?: string | null
  logoUrl: string | null
  qrDataUrl: string | null
  photoDataUrl?: string | null
  widthMm?: number
  heightMm?: number
}

export function BinLabel({
  code,
  name,
  contents,
  location,
  qrDataUrl,
  photoDataUrl,
  widthMm = 200,
  heightMm = 70,
}: BinLabelProps) {
  const hasPhoto = Boolean(photoDataUrl)
  const accentW = Math.max(1.8, widthMm * 0.012)
  const pad = heightMm * 0.08
  const mediaSize = Math.min(heightMm - pad * 2, widthMm * 0.22)
  const mediaCol = mediaSize + pad * 1.2

  const title =
    name.trim() && name.trim().toUpperCase() !== code.trim().toUpperCase()
      ? name.trim()
      : code.trim() || '—'

  const parts = [contents?.trim(), location?.trim()].filter(Boolean) as string[]
  const info = parts.length ? parts.join('  ·  ') : null

  const titleSize = Math.min(widthMm * 0.058, heightMm * 0.26)
  const infoSize = Math.min(widthMm * 0.034, heightMm * 0.15)

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
        gridTemplateColumns: hasPhoto
          ? `${accentW}mm ${mediaCol}mm minmax(0, 1fr) ${mediaCol}mm`
          : `${accentW}mm minmax(0, 1fr) ${mediaCol}mm`,
        overflow: 'hidden',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        aria-hidden
        style={{ background: 'linear-gradient(180deg, #22d3ee 0%, #0a2540 100%)' }}
      />

      {hasPhoto && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${pad * 0.55}mm`,
          }}
        >
          <img
            src={photoDataUrl!}
            alt=""
            style={{
              width: `${mediaSize}mm`,
              height: `${mediaSize}mm`,
              objectFit: 'cover',
              borderRadius: '0.8mm',
              display: 'block',
            }}
          />
        </div>
      )}

      <div
        style={{
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: `${pad}mm ${widthMm * 0.025}mm`,
          gap: `${heightMm * 0.06}mm`,
        }}
      >
        <div
          style={{
            fontSize: `${titleSize}mm`,
            fontWeight: 900,
            color: '#0a0f1a',
            lineHeight: 1.05,
            letterSpacing: '-0.015em',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
            width: '100%',
          }}
        >
          {title}
        </div>

        {info ? (
          <div
            style={{
              fontSize: `${infoSize}mm`,
              fontWeight: 600,
              color: '#475569',
              lineHeight: 1.15,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            {info}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${pad * 0.55}mm`,
          background: '#f8fafc',
        }}
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt=""
            style={{
              width: `${mediaSize}mm`,
              height: `${mediaSize}mm`,
              objectFit: 'contain',
            }}
          />
        ) : (
          <div
            style={{
              width: `${mediaSize}mm`,
              height: `${mediaSize}mm`,
              border: '0.2mm dashed #94a3b8',
              display: 'grid',
              placeItems: 'center',
              fontSize: `${infoSize * 0.8}mm`,
              color: '#94a3b8',
              fontWeight: 700,
            }}
          >
            QR
          </div>
        )}
      </div>
    </div>
  )
}
