'use client'

import { useState } from 'react'
import { paintFor } from '@/components/field/tokens/colors'
import { giveDisc } from '@/lib/diagram/entities'
import { TOKEN_COLORS, type Entity, type Player, type TokenColor } from '@/lib/diagram/schema'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { useUiStore } from '@/lib/editor/uiStore'
import { nl } from '@/lib/strings'
import { EntityMenu, type MenuActie } from './EntityMenu'
import { DiscIcon, GearIcon, PaletteIcon, TrashIcon } from './icons'
import { PlayerSettings } from './PlayerSettings'

interface Props {
  entity: Entity
  anchor: { x: number; y: number }
  tokenRadiusPx: number
}

export function SelectedEntityMenu({ entity, anchor, tokenRadiusPx }: Props) {
  const change = useDiagramStore((s) => s.change)
  const activeFrame = useUiStore((s) => s.activeFrame)
  const clearSelection = useUiStore((s) => s.clearSelection)
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
      content.entities = content.entities.filter((e) => e.id !== entity.id)
    })
    clearSelection()
  }

  const acties: MenuActie[] = []
  let paneel: React.ReactNode = null

  if (entity.type === 'player') {
    const player = entity

    // The disc always sits on the left and the bin always on the right, whatever
    // else appears in between, so the positions stay learnable.
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
      acties={acties}
      paneel={paneel}
    />
  )
}
