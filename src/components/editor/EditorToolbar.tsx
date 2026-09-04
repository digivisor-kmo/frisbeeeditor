'use client'

import { canRedo, canUndo, useDiagramStore } from '@/lib/editor/diagramStore'
import { useUiStore, type Tool } from '@/lib/editor/uiStore'
import type { Side } from '@/lib/diagram/schema'
import { nl } from '@/lib/strings'
import { OccupancyCounter } from './OccupancyCounter'

const knop = (actief: boolean, uitgeschakeld = false): React.CSSProperties => ({
  font: 'inherit',
  fontSize: '0.875rem',
  fontWeight: actief ? 600 : 400,
  minHeight: '44px',
  padding: '0 0.875rem',
  borderRadius: 'var(--radius)',
  border: `1px solid ${actief ? 'var(--accent)' : 'var(--border)'}`,
  background: actief ? 'var(--accent-zacht)' : 'var(--surface-raised)',
  color: uitgeschakeld ? 'var(--text-muted)' : 'var(--text)',
  cursor: uitgeschakeld ? 'not-allowed' : 'pointer',
  opacity: uitgeschakeld ? 0.5 : 1,
})

const TOOLS: { id: Tool; label: string }[] = [
  { id: 'select', label: nl.editor.selecteren },
  { id: 'player', label: nl.editor.speler },
  { id: 'cone', label: nl.editor.pion },
]

interface Props {
  kant: Side
  setKant: (side: Side) => void
}

export function EditorToolbar({ kant, setKant }: Props) {
  const tool = useUiStore((s) => s.tool)
  const setTool = useUiStore((s) => s.setTool)
  const snap = useUiStore((s) => s.snap)
  const setSnap = useUiStore((s) => s.setSnap)
  const selection = useUiStore((s) => s.selection)
  const clearSelection = useUiStore((s) => s.clearSelection)
  const activeFrame = useUiStore((s) => s.activeFrame)

  const doc = useDiagramStore((s) => s.doc)
  const change = useDiagramStore((s) => s.change)
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  const kanTerug = useDiagramStore(canUndo)
  const kanVooruit = useDiagramStore(canRedo)

  const entities = doc.frames[activeFrame]?.content.entities ?? []

  function verwijderSelectie() {
    if (selection.size === 0) return
    const ids = new Set(selection)
    change('Verwijderen', (draft) => {
      const content = draft.frames[activeFrame]?.content
      if (!content) return
      content.entities = content.entities.filter(
        (e) => !ids.has(e.id) && !(e.type === 'arrow' && ids.has(e.ownerId)),
      )
    })
    clearSelection()
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {TOOLS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTool(t.id)} style={knop(tool === t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tool === 'player' && (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button type="button" onClick={() => setKant('offense')} style={knop(kant === 'offense')}>
            {nl.editor.aanval}
          </button>
          <button type="button" onClick={() => setKant('defense')} style={knop(kant === 'defense')}>
            {nl.editor.verdediging}
          </button>
        </div>
      )}

      <button type="button" onClick={() => setSnap(!snap)} style={knop(snap)}>
        {nl.editor.raster}
      </button>

      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button type="button" onClick={undo} disabled={!kanTerug} style={knop(false, !kanTerug)}>
          {nl.editor.ongedaan}
        </button>
        <button type="button" onClick={redo} disabled={!kanVooruit} style={knop(false, !kanVooruit)}>
          {nl.editor.opnieuw}
        </button>
      </div>

      <button
        type="button"
        onClick={verwijderSelectie}
        disabled={selection.size === 0}
        style={{
          ...knop(false, selection.size === 0),
          color: selection.size === 0 ? 'var(--text-muted)' : 'var(--waarschuwing)',
          borderColor: selection.size === 0 ? 'var(--border)' : 'var(--waarschuwing)',
        }}
      >
        {nl.editor.verwijderen}
        {selection.size > 0 ? ` (${selection.size})` : ''}
      </button>

      <div style={{ marginLeft: 'auto' }}>
        <OccupancyCounter entities={entities} />
      </div>
    </div>
  )
}
