import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Scales an absolute mm sheet to fit the container width. */
export function PreviewFrame({
  children,
  pageW = 210,
  pageH = 297,
}: {
  children: ReactNode
  pageW?: number
  pageH?: number
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return

    const update = () => {
      const mmToPx = 96 / 25.4
      const pagePx = pageW * mmToPx
      setScale(el.clientWidth / pagePx)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [pageW])

  return (
    <div className="preview-frame">
      <div
        ref={hostRef}
        style={{
          width: '100%',
          aspectRatio: `${pageW} / ${pageH}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${pageW}mm`,
            height: `${pageH}mm`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
