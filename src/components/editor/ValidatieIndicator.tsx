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
        className="btn btn--klein"
        style={{
          borderColor: 'var(--waarschuwing-rand)',
          background: 'var(--waarschuwing-zacht)',
          color: 'var(--waarschuwing)',
          fontWeight: 600,
        }}
      >
        <span aria-hidden style={{ fontSize: 10 }}>
          ▲
        </span>
        {ontbreekt.length}
        <span style={{ fontWeight: 400 }}>{nl.validatie.knop}</span>
      </button>

      {open && (
        <div
          className="zwevend"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 'calc(100% + 6px)',
            zIndex: 6,
            minWidth: 250,
            padding: 'var(--ruimte-3)',
          }}
        >
          <p className="veld-label">{nl.validatie.titel}</p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: 'var(--tekst-sm)', lineHeight: 1.7 }}>
            {ontbreekt.map((o) => (
              <li key={o.veld}>{o.tekst}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
