'use client'

import { useState } from 'react'
import { paintFor } from '@/components/field/tokens/colors'
import {
  ARROW_LABELS,
  createArrow,
  THROW_KROMMING,
  tekenbareArrows,
} from '@/lib/diagram/arrows'
import { giveDisc } from '@/lib/diagram/entities'
import {
  TOKEN_COLORS,
  type Arrow,
  type ArrowKind,
  type Entity,
  type Player,
  type ThrowType,
  type TokenColor,
} from '@/lib/diagram/schema'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { newId } from '@/lib/editor/ids'
import { useUiStore } from '@/lib/editor/uiStore'
import { nl } from '@/lib/strings'
import { EntityMenu, type MenuActie } from './EntityMenu'
import {
  CutIcon,
  DiscIcon,
  GearIcon,
  JukeIcon,
  PaletteIcon,
  ThrowIcon,
  TrashIcon,
} from './icons'
import { PlayerSettings } from './PlayerSettings'
import { ThrowSettings } from './ThrowSettings'

interface Props {
  entity: Entity
  anchor: { x: number; y: number }
  tokenRadiusPx: number
  canvas: { breedte: number; hoogte: number }
}

const ARROW_ICONS: Record<ArrowKind, React.ReactNode> = {
  cut: <CutIcon />,
  juke: <JukeIcon />,
  throw: <ThrowIcon />,
  sight: <CutIcon />,
}

export function SelectedEntityMenu({ entity, anchor, tokenRadiusPx, canvas }: Props) {
  const change = useDiagramStore((s) => s.change)
  const weergave = useDiagramStore((s) => s.doc.meta.weergave)
  const activeFrame = useUiStore((s) => s.activeFrame)
  const select = useUiStore((s) => s.select)
  const clearSelection = useUiStore((s) => s.clearSelection)
  const setMenuOpen = useUiStore((s) => s.setMenuOpen)

  // The caller keys this component on the entity id, so selecting another
  // entity remounts it and the settings panel starts closed again.
  const [paneelOpen, setPaneelOpen] = useState(false)

  const wijzig = (label: string, recipe: (draft: Entity) => void) =>
    change(label, (draft) => {
      const target = draft.frames[activeFrame]?.content.entities.find((e) => e.id === entity.id)
      if (target) recipe(target)
    })

  const verwijder = () => {
    change(nl.menu.verwijderen, (draft) => {
      const content = draft.frames[activeFrame]?.content
      if (!content) return
      content.entities = content.entities.filter(
        (e) => e.id !== entity.id && !(e.type === 'arrow' && e.ownerId === entity.id),
      )
    })
    clearSelection()
  }

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
        change(nl.menu.schijf, (draft) => {
          const content = draft.frames[activeFrame]?.content
          if (!content) return
          giveDisc(content, player.hasDisc ? '' : player.id)
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
          change(`${ARROW_LABELS[kind]} tekenen`, (draft) => {
            const content = draft.frames[activeFrame]?.content
            if (!content) return
            content.entities.push(
              createArrow({
                id,
                ownerId: player.id,
                van: player.pos,
                kind,
                weergave,
                entities: content.entities,
              }),
            )
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
      paneel = (
        <PlayerSettings
          player={player}
          onChange={(recipe, label) =>
            wijzig(label, (draft) => {
              if (draft.type === 'player') recipe(draft as Player)
            })
          }
        />
      )
    }
  } else if (entity.type === 'arrow') {
    const arrow = entity

    for (const kind of ['cut', 'juke', 'throw'] as const) {
      // A throw can only exist while its owner holds the disc.
      if (kind === 'throw' && arrow.kind !== 'throw') continue
      acties.push({
        id: `kind-${kind}`,
        label: ARROW_LABELS[kind],
        icon: ARROW_ICONS[kind],
        actief: arrow.kind === kind,
        onClick: () =>
          wijzig(nl.menu.typeWisselen, (draft) => {
            if (draft.type !== 'arrow') return
            draft.kind = kind
            if (kind !== 'throw') {
              draft.throwType = undefined
              draft.targetId = undefined
            }
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
        <div style={{ display: 'flex', gap: 6 }}>
          {TOKEN_COLORS.map((color: TokenColor) => (
            <button
              key={color}
              type="button"
              title={nl.kleuren[color]}
              aria-label={nl.kleuren[color]}
              onClick={() =>
                wijzig(nl.menu.kleur, (draft) => {
                  if (draft.type === 'cone') draft.color = color
                })
              }
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                cursor: 'pointer',
                background: paintFor(color, 'offense').fill,
                border:
                  entity.color === color ? '2px solid var(--accent)' : '1px solid var(--border)',
              }}
            />
          ))}
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
