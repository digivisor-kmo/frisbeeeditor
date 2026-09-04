'use client'

import { occupancy, TEAM_SIZE } from '@/lib/diagram/entities'
import type { Entity } from '@/lib/diagram/schema'
import { nl } from '@/lib/strings'

export function OccupancyCounter({ entities }: { entities: readonly Entity[] }) {
  const { offense, defense } = occupancy(entities)

  const chip = (aantal: number, letter: string) => {
    const afwijkend = aantal !== TEAM_SIZE
    return (
      <span
        style={{
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          color: afwijkend ? 'var(--waarschuwing)' : 'var(--text)',
        }}
      >
        {letter} {aantal}
      </span>
    )
  }

  return (
    <div
      title={nl.editor.bezettingUitleg}
      style={{
        display: 'inline-flex',
        gap: '0.5rem',
        alignItems: 'center',
        padding: '0 0.75rem',
        minHeight: '44px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        background: 'var(--surface-raised)',
        fontSize: '0.875rem',
      }}
    >
      {chip(offense, 'A')}
      <span style={{ color: 'var(--text-muted)' }}>/</span>
      {chip(defense, 'V')}
    </div>
  )
}
