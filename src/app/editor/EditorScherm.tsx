'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { EditorCanvas } from '@/components/editor/EditorCanvas'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { buildPreset, OPSTELLING_LABELS, type Opstelling } from '@/lib/diagram/presets'
import type { Side, Weergave } from '@/lib/diagram/schema'
import { newDoc } from '@/lib/editor/document'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { newId } from '@/lib/editor/ids'
import { useUiStore } from '@/lib/editor/uiStore'
import { nl } from '@/lib/strings'

interface Props {
  weergave: Weergave
  opstelling: Opstelling
}

export function EditorScherm({ weergave, opstelling }: Props) {
  const load = useDiagramStore((s) => s.load)
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  const change = useDiagramStore((s) => s.change)
  const klaar = useDiagramStore((s) => s.doc.frames.length > 0 && s.doc.meta.naam !== '')
  const [kant, setKant] = useState<Side>('offense')

  useEffect(() => {
    load({
      ...newDoc({
        frameId: newId(),
        weergave,
        naam: OPSTELLING_LABELS[opstelling],
        content: buildPreset(opstelling, weergave, newId),
      }),
    })
    useUiStore.setState({ selection: new Set(), tool: 'select', mode: 'idle', activeFrame: 0 })
  }, [load, weergave, opstelling])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
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
        const { selection, clearSelection } = useUiStore.getState()
        if (selection.size === 0) return
        event.preventDefault()
        const ids = new Set(selection)
        const frame = useUiStore.getState().activeFrame
        change('Verwijderen', (draft) => {
          const content = draft.frames[frame]?.content
          if (!content) return
          content.entities = content.entities.filter((e) => !ids.has(e.id))
        })
        clearSelection()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, change])

  if (!klaar) return null

  return (
    <main style={{ maxWidth: '76rem', margin: '0 auto', padding: '1rem 1rem 4rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{nl.editor.titel}</h1>
        <Link href="/" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {nl.editor.terug}
        </Link>
      </div>

      <p
        role="status"
        style={{
          margin: '0.75rem 0 1rem',
          padding: '0.625rem 0.875rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--waarschuwing-rand)',
          background: 'var(--waarschuwing-zacht)',
          color: 'var(--text)',
          fontSize: '0.875rem',
        }}
      >
        {nl.editor.nietsBewaard}
      </p>

      <EditorToolbar kant={kant} setKant={setKant} />

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

      <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
        {nl.editor.hulp}
      </p>
    </main>
  )
}
