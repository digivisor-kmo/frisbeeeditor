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
  /** Size of the canvas, so the arc and the panel stay inside it. */
  canvas: { breedte: number; hoogte: number }
  acties: MenuActie[]
  paneel?: ReactNode
}

const KNOP = 44
const LABEL_AFSTAND = 30
const LABEL_TEKENBREEDTE = 5.7
const STAP_GRADEN = 34
const MAX_SPREIDING_GRADEN = 170

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

const labelBreedte = (label: string) => label.length * LABEL_TEKENBREEDTE + 14

/**
 * The one menu shape for every entity on the field: an arc of round buttons
 * around the thing you tapped, with the thing itself still visible underneath.
 *
 * It is HTML on top of the SVG rather than SVG inside it, so the buttons are
 * real buttons: keyboard reachable, and 44 px whatever the zoom does to the
 * field. All labels live in one layer above the buttons, because when they were
 * drawn next to their own button they slid underneath the neighbouring one.
 */
export function EntityMenu({ anchor, tokenRadiusPx, canvas, acties, paneel }: Props) {
  const hover = useHover()
  const [tip, setTip] = useState<string | null>(null)

  const n = acties.length
  const graden = Math.min(MAX_SPREIDING_GRADEN, STAP_GRADEN * (n - 1))
  const spreiding = n === 1 ? 0 : (graden * Math.PI) / 180
  const stap = n > 1 ? spreiding / (n - 1) : 0

  // The arc has to be wide enough that neither the buttons nor their labels
  // touch. On touch every label is permanently visible, so the arc is wider
  // there than on a desktop, where only the hovered one shows.
  let nodigeKoorde = KNOP + 10
  if (!hover) {
    for (let i = 0; i < n - 1; i++) {
      const breedte = (labelBreedte(acties[i]!.label) + labelBreedte(acties[i + 1]!.label)) / 2 + 8
      nodigeKoorde = Math.max(nodigeKoorde, breedte)
    }
  }
  const straalVoorAfstand = n > 1 ? nodigeKoorde / 2 / Math.sin(stap / 2) : 0
  const straal = Math.max(64, tokenRadiusPx + 46, straalVoorAfstand)

  // Flip downwards when the arc would run off the top of the canvas.
  const omlaag = anchor.y < straal + KNOP

  const punten = (draai: number) =>
    acties.map((_, index) => {
      const t = n === 1 ? 0 : index / (n - 1) - 0.5
      const hoek = t * spreiding + draai
      return {
        x: anchor.x + Math.sin(hoek) * straal,
        y: anchor.y + Math.cos(hoek) * straal * (omlaag ? 1 : -1),
      }
    })

  /**
   * Near the sideline the arc would run off the canvas. Rotating it around the
   * token keeps every button reachable and keeps the arc pointing at the thing
   * it belongs to, which shifting it sideways would not.
   */
  const past = (lijst: { x: number }[]) => {
    const rand = KNOP / 2 + 6
    return lijst.every((p) => p.x >= rand && p.x <= canvas.breedte - rand)
  }

  let posities = punten(0)
  if (!past(posities)) {
    for (let graad = 5; graad <= 75; graad += 5) {
      const rechts = punten((graad * Math.PI) / 180)
      if (past(rechts)) {
        posities = rechts
        break
      }
      const links = punten((-graad * Math.PI) / 180)
      if (past(links)) {
        posities = links
        break
      }
    }
  }

  const paneelBreedte = 244
  const paneelX = Math.min(
    Math.max(anchor.x, paneelBreedte / 2 + 8),
    Math.max(paneelBreedte / 2 + 8, canvas.breedte - paneelBreedte / 2 - 8),
  )
  const paneelY = omlaag ? anchor.y - straal - KNOP : anchor.y + straal * 0.62 + KNOP

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
      {acties.map((actie, index) => {
        const punt = posities[index]!
        return (
          <button
            key={actie.id}
            type="button"
            aria-label={actie.label}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={actie.onClick}
            onMouseEnter={() => hover && setTip(actie.id)}
            onMouseLeave={() => hover && setTip(null)}
            onFocus={() => setTip(actie.id)}
            onBlur={() => setTip(null)}
            className="menu-knop"
            data-actief={actie.actief ? 'ja' : undefined}
            data-gevaar={actie.gevaar ? 'ja' : undefined}
            style={{
              position: 'absolute',
              left: punt.x,
              top: punt.y,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
            }}
          >
            {actie.icon}
          </button>
        )
      })}

      {/* One layer for every label, above every button. */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        {acties.map((actie, index) => {
          const zichtbaar = hover ? tip === actie.id : true
          if (!zichtbaar) return null
          const punt = posities[index]!
          return (
            <span
              key={actie.id}
              className="menu-label"
              style={{
                position: 'absolute',
                left: punt.x,
                top: punt.y + LABEL_AFSTAND,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {actie.label}
            </span>
          )
        })}
      </div>

      {paneel && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="zwevend"
          style={{
            position: 'absolute',
            left: paneelX,
            top: paneelY,
            transform: `translate(-50%, ${omlaag ? '-100%' : '0'})`,
            pointerEvents: 'auto',
            padding: 'var(--ruimte-3)',
            width: paneelBreedte,
            maxWidth: 'calc(100vw - 2rem)',
            zIndex: 2,
          }}
        >
          {paneel}
        </div>
      )}
    </div>
  )
}
