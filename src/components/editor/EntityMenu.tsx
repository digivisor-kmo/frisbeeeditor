'use client'

import { useEffect, useState, type ReactNode } from 'react'

export interface MenuActie {
  id: string
  label: string
  icon: ReactNode
  onClick: () => void
  actief?: boolean
  gevaar?: boolean
}

interface Props {
  /** Anchor inside the canvas, in CSS pixels from its top-left corner. */
  anchor: { x: number; y: number }
  /** Radius of the token, in pixels, so the arc clears it. */
  tokenRadiusPx: number
  acties: MenuActie[]
  paneel?: ReactNode
}

const KNOP = 44
const SPREIDING_GRADEN = 150

/** Does this device have a real hover state? Touch screens do not. */
function useHover(): boolean {
  const [hover, setHover] = useState(true)
  useEffect(() => {
    const query = window.matchMedia('(hover: hover)')
    const update = () => setHover(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return hover
}

/**
 * The one menu shape for every entity on the field: an arc of round buttons
 * around the thing you tapped, with the thing itself still visible underneath.
 *
 * It is HTML on top of the SVG rather than SVG inside it, so the buttons are
 * real buttons: keyboard reachable, and 44 px whatever the zoom level does to
 * the field underneath.
 */
export function EntityMenu({ anchor, tokenRadiusPx, acties, paneel }: Props) {
  const hover = useHover()
  const [tip, setTip] = useState<string | null>(null)

  const straal = Math.max(58, tokenRadiusPx + 42)
  // Flip downwards when the arc would run off the top of the canvas.
  const omlaag = anchor.y < straal + KNOP
  const n = acties.length
  const spreiding = n === 1 ? 0 : (SPREIDING_GRADEN * Math.PI) / 180

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        inset: 0,
        zIndex: 2,
      }}
    >
      {acties.map((actie, index) => {
        const t = n === 1 ? 0 : index / (n - 1) - 0.5
        const hoek = t * spreiding
        const dx = Math.sin(hoek) * straal
        const dy = Math.cos(hoek) * straal * (omlaag ? 1 : -1)

        return (
          <div
            key={actie.id}
            style={{
              position: 'absolute',
              left: anchor.x + dx,
              top: anchor.y + dy,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              display: 'grid',
              justifyItems: 'center',
              gap: 2,
            }}
          >
            <button
              type="button"
              title={hover ? actie.label : undefined}
              aria-label={actie.label}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={actie.onClick}
              onMouseEnter={() => hover && setTip(actie.id)}
              onMouseLeave={() => hover && setTip(null)}
              style={{
                width: KNOP,
                height: KNOP,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: actie.actief ? 'var(--accent)' : 'var(--surface-raised)',
                color: actie.gevaar
                  ? 'var(--waarschuwing)'
                  : actie.actief
                    ? 'var(--accent-contrast)'
                    : 'var(--text)',
                border: `1px solid ${actie.actief ? 'var(--accent)' : 'var(--border)'}`,
                boxShadow: 'var(--shadow-float)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {actie.icon}
            </button>

            {/* Touch has no hover, so four nameless icons would be a riddle. */}
            {!hover && (
              <span
                style={{
                  fontSize: 10,
                  lineHeight: 1.1,
                  fontWeight: 600,
                  color: 'var(--text)',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '1px 4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {actie.label}
              </span>
            )}

            {hover && tip === actie.id && (
              <span
                style={{
                  position: 'absolute',
                  top: '100%',
                  marginTop: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--surface-raised)',
                  background: 'var(--text)',
                  borderRadius: 4,
                  padding: '2px 6px',
                  whiteSpace: 'nowrap',
                }}
              >
                {actie.label}
              </span>
            )}
          </div>
        )
      })}

      {paneel && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: anchor.x,
            top: anchor.y + (omlaag ? -straal - KNOP : straal + KNOP * 0.9),
            transform: 'translate(-50%, 0)',
            pointerEvents: 'auto',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-float)',
            padding: '0.625rem',
            width: 232,
            maxWidth: 'calc(100vw - 2rem)',
          }}
        >
          {paneel}
        </div>
      )}
    </div>
  )
}
