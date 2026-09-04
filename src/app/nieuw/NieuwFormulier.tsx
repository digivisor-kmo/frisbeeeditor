'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FieldCanvas } from '@/components/field/FieldCanvas'
import { buildPreset, OPSTELLING_LABELS, type Opstelling } from '@/lib/diagram/presets'
import type { Weergave } from '@/lib/diagram/schema'
import { maakDiagram } from '@/lib/data/diagrams'
import { newDoc } from '@/lib/editor/document'
import { newId } from '@/lib/editor/ids'
import { nl } from '@/lib/strings'

const WEERGAVEN: { id: Weergave; naam: string; uitleg: string }[] = [
  { id: 'volledig', naam: nl.veld.volledig, uitleg: nl.veld.volledigUitleg },
  { id: 'half', naam: nl.veld.half, uitleg: nl.veld.halfUitleg },
  { id: 'vrij', naam: nl.veld.vrij, uitleg: nl.veld.vrijUitleg },
]

const OPSTELLINGEN: Opstelling[] = ['vertical-stack', 'horizontal-stack', 'leeg']

function kaart(gekozen: boolean): React.CSSProperties {
  return {
    display: 'grid',
    gap: '0.375rem',
    textAlign: 'left',
    font: 'inherit',
    padding: '0.75rem',
    borderRadius: 'var(--radius)',
    border: `2px solid ${gekozen ? 'var(--accent)' : 'var(--border)'}`,
    background: 'var(--surface-raised)',
    color: 'var(--text)',
    cursor: 'pointer',
  }
}

export function NieuwFormulier({ magBewerken }: { magBewerken: boolean }) {
  const router = useRouter()
  const [weergave, setWeergave] = useState<Weergave>('volledig')
  const [opstelling, setOpstelling] = useState<Opstelling>('vertical-stack')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function aanmaken() {
    setBezig(true)
    setFout(null)
    try {
      const doc = newDoc({
        frameId: newId(),
        weergave,
        naam: '',
        content: buildPreset(opstelling, weergave, newId),
      })
      const id = await maakDiagram(doc)
      router.push(`/editor/${id}`)
    } catch (error) {
      setFout(error instanceof Error ? error.message : 'Onbekende fout.')
      setBezig(false)
    }
  }

  if (!magBewerken) {
    return <p style={{ color: 'var(--text-muted)' }}>{nl.nieuw.geenRechten}</p>
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <section>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
          {nl.nieuw.veldtype}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {WEERGAVEN.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setWeergave(w.id)}
              aria-pressed={weergave === w.id}
              style={kaart(weergave === w.id)}
            >
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{w.naam}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.uitleg}</span>
              <span
                style={{
                  marginTop: '0.25rem',
                  maxWidth: w.id === 'half' ? '7rem' : undefined,
                  // Not decoration: this is exactly what you are choosing.
                  filter: weergave === w.id ? 'none' : 'saturate(0.25) opacity(0.7)',
                }}
              >
                <FieldCanvas kind={w.id} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
          {nl.nieuw.opstelling}
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {OPSTELLINGEN.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOpstelling(o)}
              aria-pressed={opstelling === o}
              style={{
                ...kaart(opstelling === o),
                minHeight: 44,
                padding: '0 1rem',
                alignItems: 'center',
                fontSize: '0.875rem',
                fontWeight: opstelling === o ? 600 : 400,
              }}
            >
              {OPSTELLING_LABELS[o]}
            </button>
          ))}
        </div>
      </section>

      {fout && (
        <p role="alert" style={{ color: 'var(--waarschuwing)', fontSize: '0.875rem', margin: 0 }}>
          {nl.nieuw.fout} {fout}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={aanmaken}
          disabled={bezig}
          style={{
            font: 'inherit',
            fontSize: '0.9375rem',
            fontWeight: 600,
            minHeight: 44,
            padding: '0 1.5rem',
            borderRadius: 'var(--radius)',
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
            cursor: bezig ? 'progress' : 'pointer',
            opacity: bezig ? 0.7 : 1,
          }}
        >
          {bezig ? nl.nieuw.bezig : nl.nieuw.doorgaan}
        </button>
      </div>
    </div>
  )
}
