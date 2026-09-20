import { BinLabel } from './BinLabel'
import { CableLabel } from './CableLabel'
import { FlightCaseLabel } from './FlightCaseLabel'
import { TextLabel } from './TextLabel'
import { PAGE_MARGIN } from '../lib/layout'
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
  const landscape = page.landscape
  return (
    <div
      className={`print-page${landscape ? ' print-page--landscape' : ''}`}
      style={{
        width: `${page.pageW}mm`,
        height: `${page.pageH}mm`,
        padding: `${PAGE_MARGIN}mm`,
        background: '#fff',
        boxSizing: 'border-box',
        position: 'relative',
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* Snijlijnen alleen voor kabel/flightcase — bij bakken/tekst verstoren ze de labelranden */}
      {showCutMarks && page.kind !== 'bin' && page.kind !== 'text' && (
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
        style={
          page.mixed
            ? {
                display: 'flex',
                flexWrap: 'wrap',
                alignContent: 'flex-start',
                alignItems: 'flex-start',
                gap: `${page.gapMm}mm`,
                width: '100%',
                height: '100%',
                position: 'relative',
                zIndex: 1,
              }
            : {
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
              }
        }
      >
        {page.items.map((l, i) => {
          if (l.kind === 'text') {
            return (
              <TextLabel
                key={i}
                title={l.label}
                body={l.subtitle}
                widthMm={l.widthMm}
                heightMm={l.heightMm}
                fontFamily={l.fontFamily}
                fontBold={l.fontBold}
                fontItalic={l.fontItalic}
              />
            )
          }
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
