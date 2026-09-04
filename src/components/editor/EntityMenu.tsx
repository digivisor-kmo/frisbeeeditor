'use client'

import { useRef, useState, type ReactNode } from 'react'
import { useOmklappen } from '@/components/ui/useOmklappen'

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
const LABEL_AFSTAND = 31
const STAP_GRADEN = 34
const MAX_SPREIDING_GRADEN = 170

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
  // Which button the pointer or the keyboard is on. Only that one shows its
  // word.
  const [tip, setTip] = useState<string | null>(null)
  const ankerRef = useRef<HTMLDivElement>(null)
  const paneelRef = useRef<HTMLDivElement>(null)

  const n = acties.length
  const graden = Math.min(MAX_SPREIDING_GRADEN, STAP_GRADEN * (n - 1))
  const spreiding = n === 1 ? 0 : (graden * Math.PI) / 180
  const stap = n > 1 ? spreiding / (n - 1) : 0

  /*
   * The arc only has to keep the buttons apart. The words appear one at a time
   * under whichever button you are on, so they never need room of their own,
   * and the menu stays a ring of buttons instead of a wall of labels.
   */
  const nodigeKoorde = KNOP + 10
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

  // Preference is the side the arc is not on, but the window has the last word:
  // a panel that falls off the bottom of the screen is unreachable.
  const richting = useOmklappen(ankerRef, paneelRef, paneel !== undefined, omlaag ? 'boven' : 'onder')
  const zelfdeKantAlsBoog = (richting === 'boven') === !omlaag
  const paneelAfstand = zelfdeKantAlsBoog ? straal + KNOP * 1.1 : KNOP * 0.9
  const paneelY = richting === 'boven' ? anchor.y - paneelAfstand : anchor.y + paneelAfstand

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
      <div
        ref={ankerRef}
        aria-hidden
        style={{ position: 'absolute', left: anchor.x, top: anchor.y, width: 0, height: 0 }}
      />
      {acties.map((actie, index) => {
        const punt = posities[index]!
        return (
          <button
            key={actie.id}
            type="button"
            aria-label={actie.label}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={actie.onClick}
            onPointerEnter={(e) => e.pointerType === 'mouse' && setTip(actie.id)}
            onPointerLeave={() => setTip(null)}
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

      {/* One word at a time, above every button, for whichever button you are
          on. Six words at once turned the menu into a wall of text. */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        {acties.map((actie, index) => {
          if (tip !== actie.id) return null
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
          ref={paneelRef}
          onPointerDown={(e) => e.stopPropagation()}
          className="zwevend"
          style={{
            position: 'absolute',
            left: paneelX,
            top: paneelY,
            transform: `translate(-50%, ${richting === 'boven' ? '-100%' : '0'})`,
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
