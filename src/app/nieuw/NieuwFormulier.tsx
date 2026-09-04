'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FieldCanvas } from '@/components/field/FieldCanvas'
import { buildPreset, OPSTELLING_LABELS, type Opstelling } from '@/lib/diagram/presets'
import type { Weergave } from '@/lib/diagram/schema'
import { maakDiagram } from '@/lib/data/diagrams'
import { newDoc } from '@/lib/editor/document'
import { newId } from '@/lib/editor/ids'
import { Knop } from '@/components/ui/Knop'
import { nl } from '@/lib/strings'

const WEERGAVEN: { id: Weergave; naam: string; uitleg: string }[] = [
  { id: 'volledig', naam: nl.veld.volledig, uitleg: nl.veld.volledigUitleg },
  { id: 'half', naam: nl.veld.half, uitleg: nl.veld.halfUitleg },
  { id: 'vrij', naam: nl.veld.vrij, uitleg: nl.veld.vrijUitleg },
]

const OPSTELLINGEN: Opstelling[] = ['vertical-stack', 'horizontal-stack', 'leeg']

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
    return (
      <div className="kaart" style={{ padding: 'var(--ruimte-5)' }}>
        <p className="stil">{nl.nieuw.geenRechten}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--ruimte-5)' }}>
      <section>
        <h2 className="kop" style={{ marginBottom: 'var(--ruimte-3)' }}>
          {nl.nieuw.veldtype}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 'var(--ruimte-3)',
          }}
        >
          {WEERGAVEN.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setWeergave(w.id)}
              aria-pressed={weergave === w.id}
              className={`kaart kaart--klikbaar ${weergave === w.id ? 'kaart--gekozen' : ''}`}
              style={{
                display: 'grid',
                gap: 'var(--ruimte-1)',
                textAlign: 'left',
                font: 'inherit',
                padding: 'var(--ruimte-3)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 'var(--tekst-sm)' }}>{w.naam}</span>
              <span className="stil" style={{ fontSize: 'var(--tekst-xs)' }}>
                {w.uitleg}
              </span>
              <span
                style={{
                  marginTop: 'var(--ruimte-1)',
                  maxWidth: w.id === 'half' ? '7rem' : undefined,
                  // Not decoration: this is exactly what you are choosing.
                  filter: weergave === w.id ? 'none' : 'saturate(0.2) opacity(0.65)',
                  transition: 'filter var(--overgang)',
                }}
              >
                <FieldCanvas kind={w.id} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="kop" style={{ marginBottom: 'var(--ruimte-3)' }}>
          {nl.nieuw.opstelling}
        </h2>
        <div className="btn-groep">
          {OPSTELLINGEN.map((o) => (
            <Knop key={o} actief={opstelling === o} onClick={() => setOpstelling(o)}>
              {OPSTELLING_LABELS[o]}
            </Knop>
          ))}
        </div>
      </section>

      {fout && (
        <p role="alert" style={{ color: 'var(--waarschuwing)', fontSize: 'var(--tekst-sm)' }}>
          {nl.nieuw.fout} {fout}
        </p>
      )}

      <div>
        <Knop variant="primair" onClick={aanmaken} disabled={bezig}>
          {bezig ? nl.nieuw.bezig : nl.nieuw.doorgaan}
        </Knop>
      </div>
    </div>
  )
}
