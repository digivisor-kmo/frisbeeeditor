'use client'

import { useState } from 'react'
import type { Side } from '@/lib/diagram/schema'
import { canRedo, canUndo, useDiagramStore } from '@/lib/editor/diagramStore'
import { useUiStore, type Tool } from '@/lib/editor/uiStore'
import { watOntbreekt } from '@/lib/editor/validatie'
import type { BewaarStatus } from '@/lib/editor/useAutosave'
import { nl } from '@/lib/strings'
import { BewaarStatusLabel } from './BewaarStatus'
import { DiagramInstellingen } from './DiagramInstellingen'
import { OccupancyCounter } from './OccupancyCounter'
import { ValidatieIndicator } from './ValidatieIndicator'

const knop = (actief: boolean, uitgeschakeld = false): React.CSSProperties => ({
  font: 'inherit',
  fontSize: '0.8125rem',
  fontWeight: actief ? 600 : 400,
  minHeight: 44,
  padding: '0 0.875rem',
  borderRadius: 'var(--radius)',
  border: `1px solid ${actief ? 'var(--accent)' : 'var(--border)'}`,
  background: actief ? 'var(--accent-zacht)' : 'var(--surface-raised)',
  color: 'var(--text)',
  cursor: uitgeschakeld ? 'not-allowed' : 'pointer',
  opacity: uitgeschakeld ? 0.45 : 1,
})

/**
 * Only the tools that actually work appear. Drawing and text boxes come later,
 * and a greyed-out button for something unbuilt reads as broken.
 */
const TOOLS: { id: Tool; label: string }[] = [
  { id: 'select', label: nl.editor.selecteren },
  { id: 'player', label: nl.editor.speler },
  { id: 'cone', label: nl.editor.pion },
]

interface Props {
  kant: Side
  setKant: (side: Side) => void
  status: BewaarStatus
  fout: string | null
}

export function EditorToolbar({ kant, setKant, status, fout }: Props) {
  const [paneelOpen, setPaneelOpen] = useState(false)

  const tool = useUiStore((s) => s.tool)
  const setTool = useUiStore((s) => s.setTool)
  const snap = useUiStore((s) => s.snap)
  const setSnap = useUiStore((s) => s.setSnap)
  const activeFrame = useUiStore((s) => s.activeFrame)

  const doc = useDiagramStore((s) => s.doc)
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  const kanTerug = useDiagramStore(canUndo)
  const kanVooruit = useDiagramStore(canRedo)

  const entities = doc.frames[activeFrame]?.content.entities ?? []
  const ontbreekt = watOntbreekt(doc)

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {TOOLS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTool(t.id)} style={knop(tool === t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button type="button" onClick={undo} disabled={!kanTerug} style={knop(false, !kanTerug)}>
            {nl.editor.ongedaan}
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!kanVooruit}
            style={knop(false, !kanVooruit)}
          >
            {nl.editor.opnieuw}
          </button>
        </div>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <OccupancyCounter entities={entities} />
          <ValidatieIndicator ontbreekt={ontbreekt} />
          <BewaarStatusLabel status={status} fout={fout} />
          <button
            type="button"
            onClick={() => setPaneelOpen((o) => !o)}
            aria-expanded={paneelOpen}
            style={knop(paneelOpen)}
          >
            {paneelOpen ? nl.instellingen.minder : nl.instellingen.meer}
          </button>
        </div>
      </div>

      {paneelOpen && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.625rem',
            padding: '0.75rem',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <DiagramInstellingen />

          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
              {nl.instellingen.nieuweSpeler}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => setKant('offense')}
                style={{ ...knop(kant === 'offense'), flex: 1, minHeight: 40 }}
              >
                {nl.editor.aanval}
              </button>
              <button
                type="button"
                onClick={() => setKant('defense')}
                style={{ ...knop(kant === 'defense'), flex: 1, minHeight: 40 }}
              >
                {nl.editor.verdediging}
              </button>
            </div>
          </div>

          <label
            style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'end', minHeight: 40 }}
          >
            <input
              type="checkbox"
              checked={snap}
              onChange={(e) => setSnap(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: '0.8125rem' }}>{nl.editor.rasterUitleg}</span>
          </label>
        </div>
      )}
    </div>
  )
}
