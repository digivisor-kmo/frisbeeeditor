'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BulkPaneel } from '@/components/editor/BulkPaneel'
import { EditorCanvas } from '@/components/editor/EditorCanvas'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { FrameStrip } from '@/components/editor/FrameStrip'
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
  const activeFrame = useUiStore((s) => s.activeFrame)
  const entities = useDiagramStore((s) => s.doc.frames[activeFrame]?.content.entities ?? [])
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
    <main
      className="editor-hoofd"
      style={{
        maxWidth: '76rem',
        margin: '0 auto',
        padding: 'var(--ruimte-4) var(--ruimte-4) var(--ruimte-7)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--ruimte-3)',
          marginBottom: 'var(--ruimte-3)',
        }}
      >
        <input
          className="naam-invoer"
          aria-label={nl.editor.naamPlaceholder}
          value={naam}
          placeholder={nl.editor.naamPlaceholder}
          onChange={(e) => {
            const nieuw = e.target.value
            change('Naam', (draft) => {
              draft.meta.naam = nieuw
            })
          }}
        />
        <Link href="/" className="btn btn--klein">
          {nl.editor.terug}
        </Link>
      </div>

      <EditorToolbar kant={kant} setKant={setKant} status={status} fout={fout} />

      <div
        className="kaart veld-kaart"
        style={{
          marginTop: 'var(--ruimte-3)',
          padding: 'var(--ruimte-2)',
          maxWidth: weergave === 'half' ? '30rem' : undefined,
          marginInline: weergave === 'half' ? 'auto' : undefined,
        }}
      >
        <EditorCanvas nieuweSpelerKant={kant} />
      </div>

      {/* Under the field, never over it: at an endzone set your players stand
          exactly in the top metres of the pitch. */}
      <BulkPaneel key={selectieSleutel} entities={entities} />

      <FrameStrip />

      <p className="stil hulp-tekst" style={{ marginTop: 'var(--ruimte-3)', maxWidth: '46rem' }}>
        {nl.editor.hulp}
      </p>
    </main>
  )
}
