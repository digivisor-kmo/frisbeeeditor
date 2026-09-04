'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { laadDiagram } from '@/lib/data/diagrams'
import type { EditorDoc } from '@/lib/editor/document'
import { nl } from '@/lib/strings'
import { EditorScherm } from './EditorScherm'

export function Laden({ id }: { id: string }) {
  const [doc, setDoc] = useState<EditorDoc | null>(null)
  const [fout, setFout] = useState<string | null>(null)

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

  if (fout) {
    return (
      <main style={{ maxWidth: '28rem', margin: '5rem auto', padding: '0 var(--ruimte-4)' }}>
        <div className="kaart" style={{ padding: 'var(--ruimte-5)', display: 'grid', gap: 'var(--ruimte-3)' }}>
          <p className="kop">{nl.editor.nietGeladen}</p>
          <p className="stil">{fout}</p>
          <div>
            <Link href="/" className="btn">
              {nl.editor.terug}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // A blank white page is the worst possible loading state: it reads as broken.
  if (!doc) {
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
          {nl.editor.laden}
        </p>
      </main>
    )
  }

  return <EditorScherm doc={doc} />
}
