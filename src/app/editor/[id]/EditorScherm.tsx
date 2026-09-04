'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BulkPaneel } from '@/components/editor/BulkPaneel'
import { EditorCanvas } from '@/components/editor/EditorCanvas'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import type { Side } from '@/lib/diagram/schema'
import type { EditorDoc } from '@/lib/editor/document'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { useAutosave } from '@/lib/editor/useAutosave'
import { useUiStore } from '@/lib/editor/uiStore'
import { nl } from '@/lib/strings'

export function EditorScherm({ doc: geladen }: { doc: EditorDoc }) {
  const load = useDiagramStore((s) => s.load)
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  const change = useDiagramStore((s) => s.change)
  const naam = useDiagramStore((s) => s.doc.meta.naam)
  const weergave = useDiagramStore((s) => s.doc.meta.weergave)
  const geladenId = useDiagramStore((s) => s.doc.id)
  const entities = useDiagramStore((s) => s.doc.frames[0]?.content.entities ?? [])
  const selectieSleutel = useUiStore((s) => [...s.selection].sort().join(','))

  const [kant, setKant] = useState<Side>('offense')
  const { status, fout } = useAutosave()

  useEffect(() => {
    load(geladen)
    useUiStore.setState({
      selection: new Set(),
      tool: 'select',
      mode: 'idle',
      activeFrame: 0,
      menuOpen: false,
      actieveBocht: null,
    })
  }, [load, geladen])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const doel = event.target as HTMLElement | null
      // Never steal a key from a field the user is typing in.
      if (doel && ['INPUT', 'TEXTAREA', 'SELECT'].includes(doel.tagName)) return

      const meta = event.metaKey || event.ctrlKey
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (event.key === 'Escape') {
        useUiStore.getState().clearSelection()
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const { selection, clearSelection, activeFrame } = useUiStore.getState()
        if (selection.size === 0) return
        event.preventDefault()
        const ids = new Set(selection)
        change(nl.menu.verwijderen, (draft) => {
          const content = draft.frames[activeFrame]?.content
          if (!content) return
          content.entities = content.entities.filter(
            (e) => !ids.has(e.id) && !(e.type === 'arrow' && ids.has(e.ownerId)),
          )
        })
        clearSelection()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, change])

  if (geladenId !== geladen.id) return null

  return (
    <main style={{ maxWidth: '76rem', margin: '0 auto', padding: '1rem 1rem 4rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '0.75rem',
        }}
      >
        <input
          aria-label={nl.editor.naamPlaceholder}
          value={naam}
          placeholder={nl.editor.naamPlaceholder}
          onChange={(e) => {
            const nieuw = e.target.value
            change('Naam', (draft) => {
              draft.meta.naam = nieuw
            })
          }}
          style={{
            font: 'inherit',
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text)',
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 6,
            padding: '0.25rem 0.5rem',
            marginLeft: '-0.5rem',
            minWidth: 0,
            flex: 1,
          }}
        />
        <Link href="/" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {nl.editor.terug}
        </Link>
      </div>

      <EditorToolbar kant={kant} setKant={setKant} status={status} fout={fout} />

      <div
        style={{
          marginTop: '0.75rem',
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '0.5rem',
          maxWidth: weergave === 'half' ? '30rem' : undefined,
          marginInline: weergave === 'half' ? 'auto' : undefined,
        }}
      >
        <EditorCanvas nieuweSpelerKant={kant} />
      </div>

      {/* Under the field, never over it: at an endzone set your players stand
          exactly in the top metres of the pitch. */}
      <BulkPaneel key={selectieSleutel} entities={entities} />

      <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
        {nl.editor.hulp}
      </p>
    </main>
  )
}
