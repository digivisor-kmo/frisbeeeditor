'use client'

import { paintFor } from '@/components/field/tokens/colors'
import { Knop } from '@/components/ui/Knop'
import { Invoer, Keuze, VeldRij } from '@/components/ui/Veld'
import { ROLE_LABELS, rolesFor, rotationFor } from '@/lib/diagram/roles'
import { TOKEN_COLORS, type Player, type Side, type TokenColor } from '@/lib/diagram/schema'
import { nl } from '@/lib/strings'

interface Props {
  player: Player
  onChange: (patch: (draft: Player) => void, label: string) => void
}

export function PlayerSettings({ player, onChange }: Props) {
  const zetKant = (side: Side) => {
    if (side === player.side) return
    onChange((draft) => {
      draft.side = side
      // Offence and defence have entirely separate position lists, so the old
      // role cannot survive the switch.
      draft.role = rotationFor(side)[0]!
    }, nl.menu.kantWisselen)
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--ruimte-3)' }}>
      <div>
        <span className="veld-label">{nl.menu.kant}</span>
        <div className="btn-groep" style={{ width: '100%' }}>
          {(['offense', 'defense'] as const).map((side) => (
            <Knop
              key={side}
              klein
              actief={player.side === side}
              onClick={() => zetKant(side)}
              style={{ flex: 1 }}
            >
              {side === 'offense' ? nl.editor.aanval : nl.editor.verdediging}
            </Knop>
          ))}
        </div>
      </div>

      <VeldRij label={nl.menu.positie}>
        <Keuze
          value={player.role}
          onChange={(e) =>
            onChange((draft) => {
              draft.role = e.target.value as Player['role']
            }, nl.menu.positie)
          }
        >
          {rolesFor(player.side).map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </Keuze>
      </VeldRij>

      <VeldRij label={nl.menu.eigenLabel}>
        <Invoer
          type="text"
          maxLength={3}
          value={player.label ?? ''}
          placeholder={ROLE_LABELS[player.role]}
          onChange={(e) => {
            const waarde = e.target.value.toUpperCase().slice(0, 3)
            onChange((draft) => {
              draft.label = waarde === '' ? undefined : waarde
            }, nl.menu.eigenLabel)
          }}
        />
      </VeldRij>

      <div>
        <span className="veld-label">{nl.menu.kleur}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {TOKEN_COLORS.map((color: TokenColor) => (
            <button
              key={color}
              type="button"
              className="kleurstaal"
              title={nl.kleuren[color]}
              aria-label={nl.kleuren[color]}
              aria-pressed={player.color === color}
              onClick={() =>
                onChange((draft) => {
                  draft.color = color
                }, nl.menu.kleur)
              }
              style={{ background: paintFor(color, player.side).fill }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
