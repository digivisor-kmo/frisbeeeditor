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
    <div style={{ display: 'grid', gap: 'var(--ruimte-6)' }}>
      <section>
        <h2 className="kop" style={{ marginBottom: 'var(--ruimte-3)' }}>
          {nl.nieuw.veldtype}
        </h2>
        <div className="keuzeraster">
          {WEERGAVEN.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setWeergave(w.id)}
              aria-pressed={weergave === w.id}
              className={`kaart keuzekaart ${weergave === w.id ? 'keuzekaart--aan' : ''}`}
            >
              {/* Every card has the same well, so the three previews sit on one
                  line however tall or wide the field inside them is. */}
              <span className="keuzekaart__put">
                <span
                  className="keuzekaart__veld"
                  style={{ maxWidth: w.id === 'half' ? '3.6rem' : '100%' }}
                >
                  <FieldCanvas kind={w.id} />
                </span>
              </span>
              <span className="keuzekaart__naam">{w.naam}</span>
              <span className="keuzekaart__uitleg">{w.uitleg}</span>
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
        <p role="alert" className="melding melding--fout">
          {nl.nieuw.fout} {fout}
        </p>
      )}

      <div className="voetrij">
        <Knop variant="primair" onClick={aanmaken} disabled={bezig}>
          {bezig ? nl.nieuw.bezig : nl.nieuw.doorgaan}
        </Knop>
      </div>
    </div>
  )
}
