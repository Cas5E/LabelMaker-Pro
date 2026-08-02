import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Scales an absolute 210×297mm sheet to fit the container width. */
export function PreviewFrame({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return

    const update = () => {
      const mmToPx = 96 / 25.4
      const pagePx = 210 * mmToPx
      setScale(el.clientWidth / pagePx)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="preview-frame">
      <div
        ref={hostRef}
        style={{
          width: '100%',
          aspectRatio: '210 / 297',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '210mm',
            height: '297mm',
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
