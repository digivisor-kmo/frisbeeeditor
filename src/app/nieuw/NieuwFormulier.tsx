'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DiagramThumbnail } from '@/components/field/DiagramThumbnail'
import { FieldCanvas } from '@/components/field/FieldCanvas'
import {
  buildPreset,
  CATEGORIE_VAN_OPSTELLING,
  OPSTELLING_LABELS,
  opstellingenVoor,
  opstellingPast,
  type Opstelling,
} from '@/lib/diagram/presets'
import type { FrameContent, Weergave } from '@/lib/diagram/schema'
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

export function NieuwFormulier({ magBewerken }: { magBewerken: boolean }) {
  const router = useRouter()
  const [weergave, setWeergave] = useState<Weergave>('volledig')
  const stapTwee = useRef<HTMLElement>(null)

  /**
   * A small drawing of each formation, on the field you just picked.
   *
   * "Side stack" only means something to somebody who already knows what it
   * looks like; the picture is the explanation. They are rebuilt when the field
   * changes, because the same formation stands differently on a half pitch.
   */
  const beschikbaar = useMemo(() => opstellingenVoor(weergave), [weergave])
  const voorbeelden = useMemo(() => {
    let n = 0
    const id = () => `voorbeeld-${n++}`
    const kaartjes = {} as Record<Opstelling, FrameContent>
    for (const o of opstellingenVoor(weergave)) kaartjes[o] = buildPreset(o, weergave, id)
    return kaartjes
  }, [weergave])
  const [opstelling, setOpstelling] = useState<Opstelling>('vertical-stack')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  /**
   * Picking a field scrolls the second question into view.
   *
   * On a phone the two steps do not fit on one screen, and the second one sits
   * below the fold with nothing to suggest it is there. People chose a field,
   * saw nothing happen, and pressed on. The page moving is the answer: it shows
   * that the choice landed and what is left to decide.
   */
  function kiesWeergave(id: Weergave) {
    setWeergave(id)
    // A cup around a disc at fifty metres has nowhere to stand on a half field.
    // Rather than draw it off the edge, those formations are not offered there,
    // and a choice that just disappeared falls back to the one that always fits.
    if (!opstellingPast(opstelling, id)) setOpstelling('vertical-stack')
    const doel = stapTwee.current
    if (!doel) return

    const zacht = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!zacht) {
      doel.scrollIntoView({ block: 'start' })
      return
    }

    // Smooth scrolling is quietly ignored in some contexts — I have watched it
    // do nothing in a Chrome that scrolled instantly on the very next call. So:
    // ask nicely, and if the page has not budged a moment later, jump. Arriving
    // abruptly is a small ugliness; not arriving at all is the bug being fixed.
    const vanaf = window.scrollY
    doel.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => {
      if (Math.abs(window.scrollY - vanaf) < 2) doel.scrollIntoView({ block: 'start' })
    }, 300)
  }

  async function aanmaken() {
    setBezig(true)
    setFout(null)
    try {
      // A stack you just picked is the category; two of the three things the
      // validation counter asks for are already answered here.
      const categorie = CATEGORIE_VAN_OPSTELLING[opstelling]
      const doc = newDoc({
        frameId: newId(),
        weergave,
        naam: '',
        type: categorie ? 'speelvariant' : null,
        categorie,
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
    <div style={{ display: 'grid', gap: 'var(--ruimte-6)', minWidth: 0 }}>
      <section className="stap">
        <h2 className="kop" style={{ marginBottom: 'var(--ruimte-3)' }}>
          <span className="stap__nummer">1</span>
          {nl.nieuw.veldtype}
        </h2>
        <div className="keuzeraster">
          {WEERGAVEN.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => kiesWeergave(w.id)}
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

      <section className="stap" ref={stapTwee}>
        <h2 className="kop" style={{ marginBottom: 'var(--ruimte-3)' }}>
          <span className="stap__nummer">2</span>
          {nl.nieuw.opstelling}
        </h2>
        <div className="opstellingraster">
          {beschikbaar.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOpstelling(o)}
              aria-pressed={opstelling === o}
              className={`kaart keuzekaart keuzekaart--klein ${
                opstelling === o ? 'keuzekaart--aan' : ''
              }`}
            >
              <span className="keuzekaart__put">
                <span className="keuzekaart__veld">
                  <DiagramThumbnail content={voorbeelden[o]} weergave={weergave} />
                </span>
              </span>
              <span className="keuzekaart__naam">{OPSTELLING_LABELS[o]}</span>
            </button>
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
