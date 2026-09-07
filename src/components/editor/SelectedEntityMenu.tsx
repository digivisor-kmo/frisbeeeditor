'use client'

import { useState } from 'react'
import { paintFor } from '@/components/field/tokens/colors'
import {
  arrowEnd,
  ARROW_LABELS,
  createArrow,
  snapThrowEnd,
  THROW_KROMMING,
  tekenbareArrows,
} from '@/lib/diagram/arrows'
import { giveDisc } from '@/lib/diagram/entities'
import {
  arrowVerplaatsing,
  herberekenSchijfVanaf,
  pasStatischAanVanaf,
  verplaatsVanaf,
  verwijderSelectie,
  zetIdentiteit,
} from '@/lib/diagram/propagatie'
import {
  TOKEN_COLORS,
  type Arrow,
  type ArrowKind,
  type Entity,
  type FrameContent,
  type Player,
  type ThrowType,
  type TokenColor,
} from '@/lib/diagram/schema'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { framesVan } from '@/lib/editor/document'
import { newId } from '@/lib/editor/ids'
import { useUiStore } from '@/lib/editor/uiStore'
import { nl } from '@/lib/strings'
import { EntityMenu, type MenuActie } from './EntityMenu'
import {
  CutIcon,
  DiscIcon,
  EllipsIcon,
  GearIcon,
  CurveIcon,
  PaletteIcon,
  SlotIcon,
  SlotOpenIcon,
  TekstIcon,
  ThrowIcon,
  TrashIcon,
  ZoneIcon,
} from './icons'
import { PlayerSettings } from './PlayerSettings'
import { ThrowSettings } from './ThrowSettings'

interface Props {
  entity: Entity
  anchor: { x: number; y: number }
  tokenRadiusPx: number
  canvas: { breedte: number; hoogte: number }
  /** Opens the note editor over the field; only the canvas can place that. */
  onTekstBewerken?: () => void
}

const ARROW_ICONS: Record<ArrowKind, React.ReactNode> = {
  cut: <CutIcon />,
  curve: <CurveIcon />,
  throw: <ThrowIcon />,
  sight: <CurveIcon />,
}

const negatief = (p: { x: number; y: number }) => ({ x: -p.x, y: -p.y })

export function SelectedEntityMenu({
  entity,
  anchor,
  tokenRadiusPx,
  canvas,
  onTekstBewerken,
}: Props) {
  const change = useDiagramStore((s) => s.change)
  const weergave = useDiagramStore((s) => s.doc.meta.weergave)
  const activeFrame = useUiStore((s) => s.activeFrame)
  // The store's own array, not a derived one: deriving here would hand Zustand
  // a fresh reference on every read and spin the render loop.
  const entities = useDiagramStore((s) => s.doc.frames[activeFrame]?.content.entities)
  const select = useUiStore((s) => s.select)
  const clearSelection = useUiStore((s) => s.clearSelection)
  const setMenuOpen = useUiStore((s) => s.setMenuOpen)

  // The caller keys this component on the entity id, so selecting another
  // entity remounts it and the settings panel starts closed again.
  const [paneelOpen, setPaneelOpen] = useState(false)

  /** Changes that stay inside this one frame. */
  const wijzig = (label: string, recipe: (draft: Entity) => void) =>
    change(label, (draft) => {
      const target = draft.frames[activeFrame]?.content.entities.find((e) => e.id === entity.id)
      if (target) recipe(target)
    })

  /** Changes that reach the frames after this one as well. */
  const wijzigFrames = (label: string, recipe: (frames: FrameContent[]) => void) =>
    change(label, (draft) => recipe(framesVan(draft)))

  /**
   * Who somebody is, as opposed to where he stands: the same in every frame.
   * The recipe is applied to a copy so we can read off what it settled on.
   */
  const wijzigIdentiteit = (label: string, recipe: (draft: Player) => void) => {
    if (entity.type !== 'player') return
    const kopie = JSON.parse(JSON.stringify(entity)) as Player
    recipe(kopie)
    wijzigFrames(label, (frames) => {
      zetIdentiteit(frames, entity.id, {
        side: kopie.side,
        role: kopie.role,
        label: kopie.label,
        color: kopie.color,
      })
    })
  }

  const verwijder = () => {
    wijzigFrames(nl.menu.verwijderen, (frames) => {
      const content = frames[activeFrame]
      if (!content) return
      // A movement arrow is what carries its owner to the next frame. Take it
      // away and he has to stay where he was.
      if (entity.type === 'arrow') {
        const delta = arrowVerplaatsing(content, entity)
        if (delta) verplaatsVanaf(frames, activeFrame + 1, entity.ownerId, negatief(delta))
      }
      verwijderSelectie(frames, activeFrame, new Set([entity.id]))
      herberekenSchijfVanaf(frames, activeFrame)
    })
    clearSelection()
  }

  /**
   * Pinning a piece of scenery down.
   *
   * A locked zone or note can still be selected — that is how you unlock it —
   * but it cannot be dragged, and a drag that starts on it falls through to the
   * pitch so a selection box still works over it.
   */
  const slotActie = (vast: boolean): MenuActie => ({
    id: 'slot',
    label: vast ? nl.decor.losmaken : nl.decor.vastzetten,
    icon: vast ? <SlotIcon /> : <SlotOpenIcon />,
    actief: vast,
    onClick: () =>
      wijzigFrames(vast ? nl.decor.losmaken : nl.decor.vastzetten, (frames) => {
        pasStatischAanVanaf(frames, activeFrame, entity.id, (target) => {
          if (target.type === 'annotation' || target.type === 'text') {
            target.vergrendeld = vast ? undefined : true
          }
        })
      }),
  })

  const acties: MenuActie[] = []
  let paneel: React.ReactNode = null

  if (entity.type === 'player') {
    const player = entity

    // The disc always sits on the left and the bin always on the right, whatever
    // appears in between, so the positions stay learnable.
    acties.push({
      id: 'disc',
      label: nl.menu.schijf,
      icon: <DiscIcon />,
      actief: player.hasDisc,
      onClick: () =>
        wijzigFrames(nl.menu.schijf, (frames) => {
          const content = frames[activeFrame]
          if (!content) return
          giveDisc(content, player.hasDisc ? '' : player.id)
          herberekenSchijfVanaf(frames, activeFrame)
        }),
    })

    acties.push({
      id: 'settings',
      label: nl.menu.instellingen,
      icon: <GearIcon />,
      actief: paneelOpen,
      onClick: () => setPaneelOpen((open) => !open),
    })

    // One button per arrow this player can draw, each with its own icon. The
    // throw only appears for whoever holds the disc, which quietly enforces a
    // rule of the game.
    for (const kind of tekenbareArrows(player.hasDisc)) {
      acties.push({
        id: `arrow-${kind}`,
        label: ARROW_LABELS[kind],
        icon: ARROW_ICONS[kind],
        onClick: () => {
          const id = newId()
          wijzigFrames(`${ARROW_LABELS[kind]} tekenen`, (frames) => {
            const content = frames[activeFrame]
            if (!content) return
            const arrow = createArrow({
              id,
              ownerId: player.id,
              van: player.pos,
              kind,
              weergave,
              entities: content.entities,
            })
            content.entities.push(arrow)
            // His position in the next frame is the end of this arrow.
            const delta = arrowVerplaatsing(content, arrow)
            if (delta) verplaatsVanaf(frames, activeFrame + 1, player.id, delta)
          })
          select([id])
          setMenuOpen(false)
        },
      })
    }

    acties.push({
      id: 'delete',
      label: nl.menu.verwijderen,
      icon: <TrashIcon />,
      gevaar: true,
      onClick: verwijder,
    })

    if (paneelOpen) {
      paneel = <PlayerSettings player={player} onChange={(recipe, label) => wijzigIdentiteit(label, recipe)} />
    }
  } else if (entity.type === 'arrow') {
    const arrow = entity
    const eigenaarHeeftSchijf = (entities ?? []).some(
      (e) => e.id === arrow.ownerId && e.type === 'player' && e.hasDisc,
    )

    for (const kind of ['cut', 'curve', 'throw'] as const) {
      // A throw can only exist while its owner holds the disc, but if he does,
      // turning a cut into a throw has to be possible: the same button appears
      // in his own menu, so hiding it here would be inconsistent.
      if (kind === 'throw' && arrow.kind !== 'throw' && !eigenaarHeeftSchijf) continue
      acties.push({
        id: `kind-${kind}`,
        label: ARROW_LABELS[kind],
        icon: ARROW_ICONS[kind],
        actief: arrow.kind === kind,
        onClick: () =>
          wijzigFrames(nl.menu.typeWisselen, (frames) => {
            const content = frames[activeFrame]
            if (!content) return
            const target = content.entities.find((e) => e.id === arrow.id)
            if (!target || target.type !== 'arrow') return

            // A cut carries its owner to the next frame, a throw does not, so
            // switching between them moves him along or leaves him behind.
            const voor = arrowVerplaatsing(content, target)
            target.kind = kind
            if (kind !== 'throw') {
              target.throwType = undefined
              target.targetId = undefined
            } else {
              // A throw goes to somebody. Look who is standing where this arrow
              // already ends, so the switch does not leave a throw into nowhere.
              target.throwType = target.throwType ?? 'backhand'
              const { pos, targetId } = snapThrowEnd(
                arrowEnd(target),
                content.entities,
                target.ownerId,
              )
              target.path.points[target.path.points.length - 1] = { ...pos }
              target.targetId = targetId
            }
            const na = arrowVerplaatsing(content, target)
            verplaatsVanaf(frames, activeFrame + 1, target.ownerId, {
              x: (na?.x ?? 0) - (voor?.x ?? 0),
              y: (na?.y ?? 0) - (voor?.y ?? 0),
            })
            herberekenSchijfVanaf(frames, activeFrame)
          }),
      })
    }

    if (arrow.kind === 'throw') {
      acties.push({
        id: 'throwtype',
        label: nl.menu.worptype,
        icon: <GearIcon />,
        actief: paneelOpen,
        onClick: () => setPaneelOpen((open) => !open),
      })
    }

    acties.push({
      id: 'delete',
      label: nl.menu.verwijderen,
      icon: <TrashIcon />,
      gevaar: true,
      onClick: verwijder,
    })

    if (paneelOpen && arrow.kind === 'throw') {
      paneel = (
        <ThrowSettings
          huidig={arrow.throwType ?? 'backhand'}
          onKies={(type: ThrowType) =>
            wijzig(nl.menu.worptype, (draft) => {
              if (draft.type !== 'arrow') return
              zetWorptype(draft, type)
            })
          }
        />
      )
    }
  } else if (entity.type === 'cone') {
    acties.push({
      id: 'color',
      label: nl.menu.kleur,
      icon: <PaletteIcon />,
      actief: paneelOpen,
      onClick: () => setPaneelOpen((open) => !open),
    })
    acties.push({
      id: 'delete',
      label: nl.menu.verwijderen,
      icon: <TrashIcon />,
      gevaar: true,
      onClick: verwijder,
    })

    if (paneelOpen) {
      paneel = (
        <div className="kleurrij">
          {TOKEN_COLORS.map((color: TokenColor) => (
            <button
              key={color}
              type="button"
              className="kleurstaal"
              title={nl.kleuren[color]}
              aria-label={nl.kleuren[color]}
              aria-pressed={entity.color === color}
              onClick={() =>
                wijzigFrames(nl.menu.kleur, (frames) => {
                  zetIdentiteit(frames, entity.id, { color })
                })
              }
              style={{ background: paintFor(color, 'offense').fill }}
            />
          ))}
        </div>
      )
    }
  } else if (entity.type === 'annotation') {
    const zone = entity

    // Shape, name, colour, gone. Four buttons in the same arc as everywhere
    // else, so a zone is worked the way a player is.
    acties.push({
      id: 'vorm',
      label: zone.shape === 'ellipse' ? nl.zone.rechthoek : nl.zone.ellips,
      icon: zone.shape === 'ellipse' ? <ZoneIcon /> : <EllipsIcon />,
      onClick: () =>
        wijzigFrames(nl.zone.vorm, (frames) => {
          const vorm = zone.shape === 'ellipse' ? 'rect' : 'ellipse'
          pasStatischAanVanaf(frames, activeFrame, zone.id, (target) => {
            if (target.type === 'annotation') target.shape = vorm
          })
        }),
    })

    acties.push({
      id: 'label',
      label: nl.zone.label,
      icon: <TekstIcon />,
      // The same little field the notes use, over the top edge of the zone.
      // A browser prompt would block the page and look like 1998.
      onClick: () => {
        setMenuOpen(false)
        onTekstBewerken?.()
      },
    })

    acties.push({
      id: 'color',
      label: nl.menu.kleur,
      icon: <PaletteIcon />,
      actief: paneelOpen,
      onClick: () => setPaneelOpen((open) => !open),
    })

    acties.push(slotActie(zone.vergrendeld === true))

    acties.push({
      id: 'delete',
      label: nl.menu.verwijderen,
      icon: <TrashIcon />,
      gevaar: true,
      onClick: verwijder,
    })

    if (paneelOpen) {
      paneel = (
        <div className="kleurrij">
          {TOKEN_COLORS.map((color: TokenColor) => (
            <button
              key={color}
              type="button"
              className="kleurstaal"
              title={nl.kleuren[color]}
              aria-label={nl.kleuren[color]}
              aria-pressed={zone.style.stroke === color}
              onClick={() =>
                wijzigFrames(nl.menu.kleur, (frames) => {
                  pasStatischAanVanaf(frames, activeFrame, zone.id, (target) => {
                    if (target.type !== 'annotation') return
                    target.style.stroke = color
                    target.style.fill = color
                  })
                })
              }
              style={{ background: paintFor(color, 'offense').fill }}
            />
          ))}
        </div>
      )
    }
  } else if (entity.type === 'text') {
    const blok = entity

    acties.push({
      id: 'bewerken',
      label: nl.tekst.bewerken,
      icon: <TekstIcon />,
      onClick: () => {
        setMenuOpen(false)
        onTekstBewerken?.()
      },
    })

    acties.push({
      id: 'grootte',
      label: nl.tekst.grootte,
      icon: <GearIcon />,
      actief: paneelOpen,
      onClick: () => setPaneelOpen((open) => !open),
    })

    acties.push(slotActie(blok.vergrendeld === true))

    acties.push({
      id: 'delete',
      label: nl.menu.verwijderen,
      icon: <TrashIcon />,
      gevaar: true,
      onClick: verwijder,
    })

    if (paneelOpen) {
      paneel = (
        <div className="menu-paneel">
          <div className="btn-groep">
            {(['sm', 'md', 'lg'] as const).map((maat) => (
              <button
                key={maat}
                type="button"
                className={`btn btn--klein${blok.size === maat ? ' is-actief' : ''}`}
                onClick={() =>
                  wijzigFrames(nl.tekst.grootte, (frames) => {
                    pasStatischAanVanaf(frames, activeFrame, blok.id, (target) => {
                      if (target.type === 'text') target.size = maat
                    })
                  })
                }
              >
                {maat === 'sm' ? nl.tekst.klein : maat === 'md' ? nl.tekst.middel : nl.tekst.groot}
              </button>
            ))}
          </div>
          <div className="kleurrij">
            {TOKEN_COLORS.map((color: TokenColor) => (
              <button
                key={color}
                type="button"
                className="kleurstaal"
                title={nl.kleuren[color]}
                aria-label={nl.kleuren[color]}
                aria-pressed={blok.color === color}
                onClick={() =>
                  wijzigFrames(nl.menu.kleur, (frames) => {
                    pasStatischAanVanaf(frames, activeFrame, blok.id, (target) => {
                      if (target.type === 'text') target.color = color
                    })
                  })
                }
                style={{ background: paintFor(color, 'offense').fill }}
              />
            ))}
          </div>
        </div>
      )
    }
  } else {
    return null
  }

  return (
    <EntityMenu
      anchor={anchor}
      tokenRadiusPx={tokenRadiusPx}
      canvas={canvas}
      acties={acties}
      paneel={paneel}
    />
  )
}

/**
 * Switching throw type re-bends a still-straight throw, so you can see what you
 * picked. A throw that has already been shaped by hand is left alone.
 */
function zetWorptype(arrow: Arrow, type: ThrowType) {
  const vorige = arrow.throwType ?? 'backhand'
  arrow.throwType = type

  const punten = arrow.path.points
  if (punten.length !== 3) return

  const start = punten[0]!
  const eind = punten[2]!
  const midden = { x: (start.x + eind.x) / 2, y: (start.y + eind.y) / 2 }
  const dx = eind.x - start.x
  const dy = eind.y - start.y
  const lengte = Math.hypot(dx, dy) || 1

  const verwacht = {
    x: midden.x - (dy / lengte) * lengte * THROW_KROMMING[vorige],
    y: midden.y + (dx / lengte) * lengte * THROW_KROMMING[vorige],
  }
  const zelfGetekend =
    Math.hypot(punten[1]!.x - verwacht.x, punten[1]!.y - verwacht.y) > 0.3
  if (zelfGetekend) return

  punten[1] = {
    x: midden.x - (dy / lengte) * lengte * THROW_KROMMING[type],
    y: midden.y + (dx / lengte) * lengte * THROW_KROMMING[type],
  }
}
