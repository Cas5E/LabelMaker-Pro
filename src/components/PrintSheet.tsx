import { BinLabel } from './BinLabel'
import { CableLabel } from './CableLabel'
import { FlightCaseLabel } from './FlightCaseLabel'
import { PAGE_H, PAGE_MARGIN, PAGE_W } from '../lib/layout'
import type { PrintPageData } from '../lib/types'

interface PrintSheetProps {
  page: PrintPageData
  logoUrl: string | null
  companyTel: string
  companyWeb: string
  showCutMarks: boolean
}

export function PrintSheet({
  page,
  logoUrl,
  companyTel,
  companyWeb,
  showCutMarks,
}: PrintSheetProps) {
  return (
    <div
      className="print-page"
      style={{
        width: `${PAGE_W}mm`,
        height: `${PAGE_H}mm`,
        padding: `${PAGE_MARGIN}mm`,
        background: '#fff',
        boxSizing: 'border-box',
        position: 'relative',
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* Snijlijnen alleen voor kabel/flightcase — bij bakken verstoren ze de labelranden in print */}
      {showCutMarks && page.kind !== 'bin' && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: `${PAGE_MARGIN}mm`,
            pointerEvents: 'none',
            backgroundImage: `
              repeating-linear-gradient(
                to right,
                transparent 0,
                transparent calc(${page.widthMm}mm + ${page.gapMm}mm - 0.2mm),
                #cbd5e1 calc(${page.widthMm}mm + ${page.gapMm}mm - 0.2mm),
                #cbd5e1 calc(${page.widthMm}mm + ${page.gapMm}mm)
              ),
              repeating-linear-gradient(
                to bottom,
                transparent 0,
                transparent calc(${page.heightMm}mm + ${page.gapMm}mm - 0.2mm),
                #cbd5e1 calc(${page.heightMm}mm + ${page.gapMm}mm - 0.2mm),
                #cbd5e1 calc(${page.heightMm}mm + ${page.gapMm}mm)
              )
            `,
            opacity: 0.45,
          }}
        />
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${page.cols}, ${page.widthMm}mm)`,
          gridTemplateRows: `repeat(${page.rows}, ${page.heightMm}mm)`,
          gap: `${page.gapMm}mm`,
          justifyContent: 'center',
          alignContent: 'start',
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {page.items.map((l, i) => {
          if (l.kind === 'bin') {
            return (
              <BinLabel
                key={i}
                code={l.label}
                name={l.subtitle || l.label}
                contents={l.contents}
                location={l.location}
                logoUrl={logoUrl}
                qrDataUrl={l.qrDataUrl ?? null}
                photoDataUrl={l.photoDataUrl ?? null}
                widthMm={l.widthMm}
                heightMm={l.heightMm}
              />
            )
          }
          if (l.kind === 'flightcase') {
            return (
              <FlightCaseLabel
                key={i}
                label={l.label}
                subtitle={l.subtitle}
                logoUrl={logoUrl}
                companyTel={companyTel}
                companyWeb={companyWeb}
                widthMm={l.widthMm}
                heightMm={l.heightMm}
              />
            )
          }
          return (
            <CableLabel
              key={i}
              label={l.label}
              color={l.color}
              textColor={l.textColor}
              logoUrl={logoUrl}
              widthMm={l.widthMm}
              heightMm={l.heightMm}
            />
          )
        })}
      </div>
    </div>
  )
}
