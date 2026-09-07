'use client'

import { useState, type ReactNode } from 'react'

export interface MenuActie {
  id: string
  label: string
  icon: ReactNode
  onClick: () => void
  actief?: boolean
  gevaar?: boolean
}

/** How much of the canvas is covered by something else and must be kept clear. */
export interface VeiligeRand {
  boven: number
  onder: number
  links: number
  rechts: number
}

interface Props {
  /** Anchor inside the canvas, in CSS pixels from its top-left corner. */
  anchor: { x: number; y: number }
  /** Radius of the token, in pixels, so the arc clears it. */
  tokenRadiusPx: number
  /** Size of the canvas, so the arc and the panel stay inside it. */
  canvas: { breedte: number; hoogte: number }
  /**
   * What the arc and the panel have to stay out of: the floating controls on a
   * phone, or nothing much on a laptop.
   */
  veilig?: VeiligeRand
  acties: MenuActie[]
  paneel?: ReactNode
}

const KNOP = 44
const STAP_GRADEN = 34
const MAX_SPREIDING_GRADEN = 170
const PANEEL_BREEDTE = 244
/** What a panel needs before it is worth putting somewhere, in pixels. */
const PANEEL_HOOGTE = 136
const RUIM = 8

const KANTLIJN: VeiligeRand = { boven: RUIM, onder: RUIM, links: RUIM, rechts: RUIM }

const klem = (waarde: number, laag: number, hoog: number) =>
  Math.min(Math.max(waarde, laag), Math.max(laag, hoog))

/**
 * The one menu shape for every entity on the field: an arc of round buttons
 * around the thing you tapped, with the thing itself still visible underneath.
 *
 * It is HTML on top of the SVG rather than SVG inside it, so the buttons are
 * real buttons: keyboard reachable, and 44 px whatever the zoom does to the
 * field.
 *
 * Everything here is placed against one rectangle: the canvas minus whatever
 * else is floating over it. That rectangle is the whole answer to "where does
 * this go on a phone, sideways, with two rows of controls in the way" — the arc
 * flips into it, the word sits outside the arc but inside it, and the panel
 * goes below, above or beside depending on which of those fits. Nothing is
 * placed on a screen size; everything is placed on the room that is left.
 */
export function EntityMenu({
  anchor,
  tokenRadiusPx,
  canvas,
  veilig = KANTLIJN,
  acties,
  paneel,
}: Props) {
  // Which button the pointer or the keyboard is on. Only that one shows its word.
  const [tip, setTip] = useState<string | null>(null)

  const vak = {
    links: veilig.links,
    rechts: canvas.breedte - veilig.rechts,
    boven: veilig.boven,
    onder: canvas.hoogte - veilig.onder,
  }

  const n = acties.length
  const graden = Math.min(MAX_SPREIDING_GRADEN, STAP_GRADEN * (n - 1))
  const spreiding = n === 1 ? 0 : (graden * Math.PI) / 180
  const stap = n > 1 ? spreiding / (n - 1) : 0

  const nodigeKoorde = KNOP + 10
  const straalVoorAfstand = n > 1 ? nodigeKoorde / 2 / Math.sin(stap / 2) : 0
  const straal = Math.max(64, tokenRadiusPx + 46, straalVoorAfstand)

  // Above unless there is no room above, and then below — measured against the
  // usable rectangle, not against the window.
  const ruimteBoven = anchor.y - straal - KNOP / 2 - vak.boven
  const ruimteOnder = vak.onder - (anchor.y + straal + KNOP / 2)
  const omlaag = ruimteBoven < 0 && ruimteOnder > ruimteBoven

  const hoeken = acties.map((_, index) => {
    const t = n === 1 ? 0 : index / (n - 1) - 0.5
    return t * spreiding
  })

  const puntOp = (hoek: number, r: number) => ({
    x: anchor.x + Math.sin(hoek) * r,
    y: anchor.y + Math.cos(hoek) * r * (omlaag ? 1 : -1),
  })

  /**
   * Near the sideline the arc would run off the canvas. Rotating it around the
   * token keeps every button reachable and keeps the arc pointing at the thing
   * it belongs to, which shifting it sideways would not.
   */
  const past = (draai: number) => {
    const rand = KNOP / 2 + 6
    return hoeken.every((hoek) => {
      const p = puntOp(hoek + draai, straal)
      return p.x >= vak.links + rand && p.x <= vak.rechts - rand
    })
  }

  let draai = 0
  if (!past(0)) {
    for (let graad = 5; graad <= 75; graad += 5) {
      if (past((graad * Math.PI) / 180)) {
        draai = (graad * Math.PI) / 180
        break
      }
      if (past((-graad * Math.PI) / 180)) {
        draai = (-graad * Math.PI) / 180
        break
      }
    }
  }

  const posities = hoeken.map((hoek) => puntOp(hoek + draai, straal))
  /*
   * The word sits further out along the same spoke as its own button, never
   * between two buttons. Under the button it landed on top of the neighbour,
   * which is exactly where your finger was going next.
   */
  const labelPosities = hoeken.map((hoek) => puntOp(hoek + draai, straal + KNOP * 0.66))

  const arcOnder = omlaag ? anchor.y + straal + KNOP / 2 : anchor.y + tokenRadiusPx + RUIM
  const arcBoven = omlaag ? anchor.y - tokenRadiusPx - RUIM : anchor.y - straal - KNOP / 2

  /*
   * Below, above, or beside. Sideways on a phone the band between the two rows
   * of floating controls is barely three hundred pixels tall and a panel simply
   * does not fit under an arc — but there is a screen's worth of width next to
   * it, and that is where it goes.
   */
  const onderRuimte = vak.onder - arcOnder
  const bovenRuimte = arcBoven - vak.boven
  const naast = onderRuimte < PANEEL_HOOGTE && bovenRuimte < PANEEL_HOOGTE
  const rechtsRuimte = vak.rechts - (anchor.x + straal)
  const naastRechts = rechtsRuimte >= anchor.x - straal - vak.links

  const paneelHoogte = naast
    ? vak.onder - vak.boven - RUIM * 2
    : Math.max(onderRuimte, bovenRuimte) - RUIM * 2

  let paneelX: number
  let paneelY: number
  let verschuif: string

  if (naast) {
    paneelX = naastRechts
      ? klem(anchor.x + straal + RUIM, vak.links, vak.rechts - PANEEL_BREEDTE)
      : klem(anchor.x - straal - RUIM - PANEEL_BREEDTE, vak.links, vak.rechts - PANEEL_BREEDTE)
    paneelY = klem(anchor.y - paneelHoogte / 2, vak.boven + RUIM, vak.onder - RUIM)
    verschuif = 'translate(0, 0)'
  } else {
    const halfBreed = PANEEL_BREEDTE / 2
    paneelX = klem(anchor.x, vak.links + halfBreed, vak.rechts - halfBreed)
    if (onderRuimte >= PANEEL_HOOGTE) {
      paneelY = arcOnder + RUIM
      verschuif = 'translate(-50%, 0)'
    } else {
      paneelY = arcBoven - RUIM
      verschuif = 'translate(-50%, -100%)'
    }
  }

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

      {/* One word at a time, for whichever button you are on. Six words at once
          turned the menu into a wall of text. */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        {acties.map((actie, index) => {
          if (tip !== actie.id) return null
          const punt = labelPosities[index]!
          return (
            <span
              key={actie.id}
              className="menu-label"
              style={{
                position: 'absolute',
                left: klem(punt.x, vak.links + 40, vak.rechts - 40),
                top: klem(punt.y, vak.boven + 12, vak.onder - 12),
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
            transform: verschuif,
            pointerEvents: 'auto',
            padding: 'var(--ruimte-3)',
            width: PANEEL_BREEDTE,
            maxWidth: `calc(100% - ${RUIM * 2}px)`,
            maxHeight: Math.max(paneelHoogte, 120),
            overflowY: 'auto',
            zIndex: 2,
          }}
        >
          {paneel}
        </div>
      )}
    </div>
  )
}
