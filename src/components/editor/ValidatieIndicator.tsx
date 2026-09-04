'use client'

import { useRef, useState } from 'react'
import { useOmklappen } from '@/components/ui/useOmklappen'
import type { Ontbreekt } from '@/lib/editor/validatie'
import { nl } from '@/lib/strings'

export function ValidatieIndicator({ ontbreekt }: { ontbreekt: Ontbreekt[] }) {
  const [open, setOpen] = useState(false)
  const knopRef = useRef<HTMLButtonElement>(null)
  const paneelRef = useRef<HTMLDivElement>(null)
  const richting = useOmklappen(knopRef, paneelRef, open, 'onder')

  if (ontbreekt.length === 0) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={knopRef}
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
          ref={paneelRef}
          className="zwevend"
          style={{
            position: 'absolute',
            right: 0,
            [richting === 'onder' ? 'top' : 'bottom']: 'calc(100% + 6px)',
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
