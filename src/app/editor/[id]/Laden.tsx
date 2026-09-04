'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Knop } from '@/components/ui/Knop'
import { laadDiagram } from '@/lib/data/diagrams'
import type { EditorDoc } from '@/lib/editor/document'
import { useVergrendeling } from '@/lib/editor/useVergrendeling'
import { nl } from '@/lib/strings'
import { EditorScherm } from './EditorScherm'

export function Laden({ id, magBewerken }: { id: string; magBewerken: boolean }) {
  const [doc, setDoc] = useState<EditorDoc | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const slot = useVergrendeling(id, magBewerken)

  useEffect(() => {
    let afgebroken = false
    laadDiagram(id)
      .then((geladen) => {
        if (!afgebroken) setDoc(geladen)
      })
      .catch((error: unknown) => {
        if (!afgebroken) setFout(error instanceof Error ? error.message : 'Laden mislukt.')
      })
    return () => {
      afgebroken = true
    }
  }, [id])

  if (fout) return <Bericht kop={nl.editor.nietGeladen} tekst={fout} />

  // Somebody else has it open. Say who, and do not put a half-working editor on
  // screen: buttons that do nothing are worse than no buttons.
  if (slot.status === 'bezet') {
    return (
      <Bericht
        kop={nl.slot.bezet}
        tekst={slot.houder ? nl.slot.bezetUitleg(slot.houder) : nl.slot.bezetOnbekend}
        onder={nl.slot.bezetTip}
        actie={<Knop onClick={slot.opnieuw}>{nl.slot.opnieuw}</Knop>}
      />
    )
  }

  // The lock was taken over while this tab was away.
  if (slot.status === 'verloren') {
    return (
      <Bericht
        kop={nl.slot.verloren}
        tekst={slot.houder ? nl.slot.verlorenUitleg : nl.slot.verlorenAlleen}
        actie={<Knop onClick={slot.opnieuw}>{nl.slot.opnieuw}</Knop>}
      />
    )
  }

  if (slot.status === 'fout') {
    return <Bericht kop={nl.slot.fout} tekst={slot.fout ?? ''} actie={<Knop onClick={slot.opnieuw}>{nl.slot.opnieuw}</Knop>} />
  }

  // A blank white page is the worst possible loading state: it reads as broken.
  if (!doc || slot.status === 'bezig') {
    return (
      <main
        style={{
          maxWidth: '76rem',
          margin: '0 auto',
          padding: 'var(--ruimte-4) var(--ruimte-4) var(--ruimte-7)',
        }}
        aria-busy="true"
      >
        <div className="skelet" style={{ height: 34, width: '16rem', marginBottom: 'var(--ruimte-3)' }} />
        <div className="skelet" style={{ height: 36, marginBottom: 'var(--ruimte-3)' }} />
        <div className="skelet" style={{ aspectRatio: '106 / 43', borderRadius: 'var(--radius-lg)' }} />
        <p className="stil" style={{ marginTop: 'var(--ruimte-3)' }}>
          {doc ? nl.slot.controle : nl.editor.laden}
        </p>
      </main>
    )
  }

  return <EditorScherm doc={doc} magBewerken={magBewerken} />
}

function Bericht({
  kop,
  tekst,
  onder,
  actie,
}: {
  kop: string
  tekst: string
  onder?: string
  actie?: React.ReactNode
}) {
  return (
    <main style={{ maxWidth: '30rem', margin: '5rem auto', padding: '0 var(--ruimte-4)' }}>
      <div className="kaart" style={{ padding: 'var(--ruimte-5)', display: 'grid', gap: 'var(--ruimte-3)' }}>
        <p className="kop">{kop}</p>
        <p className="stil">{tekst}</p>
        {onder && <p className="stil">{onder}</p>}
        <div style={{ display: 'flex', gap: 'var(--ruimte-2)', flexWrap: 'wrap' }}>
          {actie}
          <Link href="/" className="btn btn--primair">
            {nl.slot.naarOverzicht}
          </Link>
        </div>
      </div>
    </main>
  )
}
