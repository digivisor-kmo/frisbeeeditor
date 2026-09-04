'use client'

import { useState } from 'react'
import { Knop } from '@/components/ui/Knop'
import { Aanvink } from '@/components/ui/Veld'
import type { Side } from '@/lib/diagram/schema'
import { canRedo, canUndo, useDiagramStore } from '@/lib/editor/diagramStore'
import { useUiStore, type Tool } from '@/lib/editor/uiStore'
import type { BewaarStatus } from '@/lib/editor/useAutosave'
import { watOntbreekt } from '@/lib/editor/validatie'
import { nl } from '@/lib/strings'
import { BewaarStatusLabel } from './BewaarStatus'
import { DiagramInstellingen } from './DiagramInstellingen'
import { FrameNavigator } from './FrameNavigator'
import { OccupancyCounter } from './OccupancyCounter'
import { ValidatieIndicator } from './ValidatieIndicator'

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
  const zoom = useUiStore((s) => s.zoom)
  const resetCamera = useUiStore((s) => s.resetCamera)

  const doc = useDiagramStore((s) => s.doc)
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  const kanTerug = useDiagramStore(canUndo)
  const kanVooruit = useDiagramStore(canRedo)

  const entities = doc.frames[activeFrame]?.content.entities ?? []
  const ontbreekt = watOntbreekt(doc)

  return (
    <div className="editor-chrome" style={{ display: 'grid', gap: 'var(--ruimte-2)' }}>
      {paneelOpen && (
        <div className="paneel editor-paneel">
          <DiagramInstellingen />

          <div>
            <span className="veld-label">{nl.instellingen.nieuweSpeler}</span>
            <div className="btn-groep" style={{ width: '100%' }}>
              <Knop klein actief={kant === 'offense'} onClick={() => setKant('offense')} style={{ flex: 1 }}>
                {nl.editor.aanval}
              </Knop>
              <Knop klein actief={kant === 'defense'} onClick={() => setKant('defense')} style={{ flex: 1 }}>
                {nl.editor.verdediging}
              </Knop>
            </div>
          </div>

          <div style={{ alignSelf: 'end' }}>
            <Aanvink label={nl.editor.rasterUitleg} checked={snap} onChange={setSnap} />
          </div>
        </div>
      )}

      <div className="editor-balk">
        <FrameNavigator />

        <div className="btn-groep">
          {TOOLS.map((t) => (
            <Knop key={t.id} klein actief={tool === t.id} onClick={() => setTool(t.id)}>
              {t.label}
            </Knop>
          ))}
        </div>

        <div className="btn-groep">
          <Knop klein onClick={undo} disabled={!kanTerug}>
            {nl.editor.ongedaan}
          </Knop>
          <Knop klein onClick={redo} disabled={!kanVooruit}>
            {nl.editor.opnieuw}
          </Knop>
        </div>

        <div className="editor-balk__rechts">
          {zoom > 1.01 && (
            <Knop klein onClick={resetCamera} title={nl.editor.zoomUit}>
              {Math.round(zoom * 100)}%
            </Knop>
          )}
          <OccupancyCounter entities={entities} />
          <ValidatieIndicator ontbreekt={ontbreekt} />
          <BewaarStatusLabel status={status} fout={fout} />
          <Knop klein actief={paneelOpen} aria-expanded={paneelOpen} onClick={() => setPaneelOpen((o) => !o)}>
            {paneelOpen ? nl.instellingen.minder : nl.instellingen.meer}
          </Knop>
        </div>
      </div>
    </div>
  )
}
