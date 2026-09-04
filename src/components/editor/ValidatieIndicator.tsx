'use client'

import { useState } from 'react'
import type { Ontbreekt } from '@/lib/editor/validatie'
import { nl } from '@/lib/strings'

export function ValidatieIndicator({ ontbreekt }: { ontbreekt: Ontbreekt[] }) {
  const [open, setOpen] = useState(false)
  if (ontbreekt.length === 0) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          font: 'inherit',
          fontSize: '0.8125rem',
          fontWeight: 600,
          minHeight: 40,
          padding: '0 0.75rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--waarschuwing-rand)',
          background: 'var(--waarschuwing-zacht)',
          color: 'var(--waarschuwing)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span aria-hidden>▲</span>
        {ontbreekt.length}
        <span style={{ fontWeight: 400 }}>{nl.validatie.knop}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            zIndex: 3,
            minWidth: 240,
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-float)',
            padding: '0.625rem 0.75rem',
          }}
        >
          <p style={{ margin: '0 0 0.5rem', fontSize: 11, color: 'var(--text-muted)' }}>
            {nl.validatie.titel}
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8125rem', lineHeight: 1.6 }}>
            {ontbreekt.map((o) => (
              <li key={o.veld}>{o.tekst}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
