'use client'

import { occupancy, TEAM_SIZE } from '@/lib/diagram/entities'
import type { Entity } from '@/lib/diagram/schema'
import { nl } from '@/lib/strings'

export function OccupancyCounter({ entities }: { entities: readonly Entity[] }) {
  const { offense, defense } = occupancy(entities)

  const chip = (aantal: number, letter: string, kleur: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span
        aria-hidden
        style={{ width: 8, height: 8, borderRadius: '50%', background: kleur, flexShrink: 0 }}
      />
      <span
        style={{
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          color: aantal === TEAM_SIZE ? 'var(--text)' : 'var(--waarschuwing)',
        }}
      >
        {letter} {aantal}
      </span>
    </span>
  )

  return (
    <span
      title={nl.editor.bezettingUitleg}
      style={{
        display: 'inline-flex',
        gap: 'var(--ruimte-2)',
        alignItems: 'center',
        padding: '0 var(--ruimte-3)',
        minHeight: 36,
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        background: 'var(--surface-raised)',
        fontSize: 'var(--tekst-sm)',
      }}
    >
      {chip(offense, 'A', 'var(--team-a)')}
      {chip(defense, 'V', 'var(--team-b)')}
    </span>
  )
}
