'use client'

import { paintFor } from '@/components/field/tokens/colors'
import { rolesFor, ROLE_LABELS, rotationFor } from '@/lib/diagram/roles'
import { TOKEN_COLORS, type Player, type Side, type TokenColor } from '@/lib/diagram/schema'
import { nl } from '@/lib/strings'

interface Props {
  player: Player
  onChange: (patch: (draft: Player) => void, label: string) => void
}

const rij: React.CSSProperties = { display: 'grid', gap: 4, marginBottom: 10 }
const label: React.CSSProperties = { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }

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
    <div>
      <div style={rij}>
        <span style={label}>{nl.menu.kant}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['offense', 'defense'] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => zetKant(side)}
              style={{
                flex: 1,
                font: 'inherit',
                fontSize: 12,
                minHeight: 36,
                borderRadius: 6,
                cursor: 'pointer',
                border: `1px solid ${player.side === side ? 'var(--accent)' : 'var(--border)'}`,
                background: player.side === side ? 'var(--accent-zacht)' : 'var(--surface-raised)',
                color: 'var(--text)',
                fontWeight: player.side === side ? 600 : 400,
              }}
            >
              {side === 'offense' ? nl.editor.aanval : nl.editor.verdediging}
            </button>
          ))}
        </div>
      </div>

      <div style={rij}>
        <span style={label}>{nl.menu.positie}</span>
        <select
          value={player.role}
          onChange={(e) =>
            onChange((draft) => {
              draft.role = e.target.value as Player['role']
            }, nl.menu.positie)
          }
          style={{
            font: 'inherit',
            fontSize: 12,
            minHeight: 36,
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--surface-raised)',
            color: 'var(--text)',
            padding: '0 6px',
          }}
        >
          {rolesFor(player.side).map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>

      <div style={rij}>
        <span style={label}>{nl.menu.eigenLabel}</span>
        <input
          type="text"
          maxLength={3}
          value={player.label ?? ''}
          placeholder={nl.menu.eigenLabelLeeg}
          onChange={(e) => {
            const waarde = e.target.value.toUpperCase().slice(0, 3)
            onChange((draft) => {
              draft.label = waarde === '' ? undefined : waarde
            }, nl.menu.eigenLabel)
          }}
          style={{
            font: 'inherit',
            fontSize: 12,
            minHeight: 36,
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--surface-raised)',
            color: 'var(--text)',
            padding: '0 8px',
          }}
        />
      </div>

      <div style={{ ...rij, marginBottom: 0 }}>
        <span style={label}>{nl.menu.kleur}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {TOKEN_COLORS.map((color: TokenColor) => {
            const paint = paintFor(color, player.side)
            const gekozen = player.color === color
            return (
              <button
                key={color}
                type="button"
                title={nl.kleuren[color]}
                aria-label={nl.kleuren[color]}
                onClick={() =>
                  onChange((draft) => {
                    draft.color = color
                  }, nl.menu.kleur)
                }
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  background: paint.fill,
                  border: gekozen ? '2px solid var(--accent)' : '1px solid var(--border)',
                  outline: gekozen ? '2px solid var(--surface-raised)' : 'none',
                  outlineOffset: -4,
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
