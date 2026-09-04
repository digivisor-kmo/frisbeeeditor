'use client'

import { THROW_LABELS, THROW_TYPES } from '@/lib/diagram/arrows'
import type { ThrowType } from '@/lib/diagram/schema'
import { nl } from '@/lib/strings'

interface Props {
  huidig: ThrowType
  onKies: (type: ThrowType) => void
}

export function ThrowSettings({ huidig, onKies }: Props) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
        {nl.menu.worptype}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
        {THROW_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onKies(type)}
            style={{
              font: 'inherit',
              fontSize: 12,
              minHeight: 36,
              borderRadius: 6,
              cursor: 'pointer',
              border: `1px solid ${huidig === type ? 'var(--accent)' : 'var(--border)'}`,
              background: huidig === type ? 'var(--accent-zacht)' : 'var(--surface-raised)',
              color: 'var(--text)',
              fontWeight: huidig === type ? 600 : 400,
            }}
          >
            {THROW_LABELS[type]}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.35 }}>
        {nl.menu.worptypeUitleg}
      </p>
    </div>
  )
}
