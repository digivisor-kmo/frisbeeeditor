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
      <main style={{ maxWidth: '32rem', margin: '4rem auto', padding: '0 1rem' }}>
        <p style={{ color: 'var(--waarschuwing)' }}>{fout}</p>
        <Link href="/">{nl.editor.terug}</Link>
      </main>
    )
  }

  if (!doc) return null
  return <EditorScherm doc={doc} />
}
