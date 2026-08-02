import { FitText } from './FitText'

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

const ACCENT_SVG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="100" preserveAspectRatio="none" viewBox="0 0 8 100">
      <defs>
        <linearGradient id="a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#0a2540"/>
        </linearGradient>
      </defs>
      <rect width="8" height="100" fill="url(#a)"/>
    </svg>`,
  )

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
  const accentW = Math.max(2.2, widthMm * 0.015)
  const pad = heightMm * 0.08
  const mediaSize = Math.min(heightMm - pad * 2, widthMm * 0.22)
  const mediaCol = mediaSize + pad * 1.1

  const title =
    name.trim() && name.trim().toUpperCase() !== code.trim().toUpperCase()
      ? name.trim()
      : code.trim() || '—'

  const parts = [contents?.trim(), location?.trim()].filter(Boolean) as string[]
  const info = parts.length ? parts.join('  ·  ') : null

  const titleMax = Math.min(widthMm * 0.058, heightMm * 0.26)
  const infoMax = Math.min(widthMm * 0.034, heightMm * 0.15)
  // Ruimteverdeling: titel krijgt meer hoogte dan info
  const titleBoxH = info ? heightMm * 0.42 : heightMm * 0.55
  const infoBoxH = heightMm * 0.2
  const textColW =
    widthMm - accentW - mediaCol - (hasPhoto ? mediaCol : 0) - widthMm * 0.05

  return (
    <div
      className="label-tile bin-label"
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
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <img
        src={ACCENT_SVG}
        alt=""
        aria-hidden
        className="bin-label-accent"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${accentW}mm`,
          height: `${heightMm}mm`,
          display: 'block',
          objectFit: 'fill',
          border: 0,
          margin: 0,
          padding: 0,
          zIndex: 2,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          paddingLeft: `${accentW}mm`,
          boxSizing: 'border-box',
        }}
      >
        {hasPhoto && (
          <div
            style={{
              flex: `0 0 ${mediaCol}mm`,
              width: `${mediaCol}mm`,
              height: `${heightMm}mm`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              borderRight: '0.25mm solid #0a0f1a',
            }}
          >
            <img
              src={photoDataUrl!}
              alt=""
              style={{
                width: `${mediaSize}mm`,
                height: `${mediaSize}mm`,
                objectFit: 'cover',
                borderRadius: '0.6mm',
                display: 'block',
              }}
            />
          </div>
        )}

        <div
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            height: `${heightMm}mm`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: `${pad}mm ${widthMm * 0.025}mm`,
            gap: `${heightMm * 0.05}mm`,
            boxSizing: 'border-box',
          }}
        >
          <FitText
            text={title}
            widthMm={Math.max(20, textColW)}
            heightMm={titleBoxH}
            maxMm={titleMax}
            minMm={Math.max(2.2, heightMm * 0.05)}
            maxLines={2}
            fontWeight={900}
            color="#0a0f1a"
            letterSpacing="-0.015em"
          />

          {info ? (
            <FitText
              text={info}
              widthMm={Math.max(20, textColW)}
              heightMm={infoBoxH}
              maxMm={infoMax}
              minMm={Math.max(1.6, heightMm * 0.035)}
              maxLines={1}
              fontWeight={600}
              color="#475569"
            />
          ) : null}
        </div>

        <div
          className="bin-label-qr"
          style={{
            flex: `0 0 ${mediaCol}mm`,
            width: `${mediaCol}mm`,
            height: `${heightMm}mm`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            borderLeft: '0.25mm solid #0a0f1a',
            backgroundColor: '#f1f5f9',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
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
                display: 'block',
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
                fontSize: `${Math.max(2, infoMax * 0.8)}mm`,
                color: '#94a3b8',
                fontWeight: 700,
              }}
            >
              QR
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
