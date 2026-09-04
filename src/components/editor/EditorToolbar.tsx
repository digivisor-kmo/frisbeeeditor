'use client'

import { useState } from 'react'
import { Knop } from '@/components/ui/Knop'
import { Aanvink } from '@/components/ui/Veld'
import type { Side } from '@/lib/diagram/schema'
import { canRedo, canUndo, useDiagramStore } from '@/lib/editor/diagramStore'
import { useUiStore, type Tool } from '@/lib/editor/uiStore'
import { nl } from '@/lib/strings'
import { Afspeelinstellingen } from './Afspeelinstellingen'
import { DiagramInstellingen } from './DiagramInstellingen'
import { FrameNavigator } from './FrameNavigator'
import {
  CursorIcon,
  OngedaanIcon,
  OpnieuwIcon,
  PionIcon,
  SchuivenIcon,
  SpelerIcon,
} from './icons'

/**
 * Only the tools that actually work appear. Drawing and text boxes come later,
 * and a greyed-out button for something unbuilt reads as broken.
 *
 * Icon plus word: the icon is what you find back at a glance once you know it,
 * the word is what tells you the first time. On a phone the word steps aside.
 */
const TOOLS: { id: Tool; label: string; icoon: React.ReactNode }[] = [
  { id: 'select', label: nl.editor.selecteren, icoon: <CursorIcon /> },
  { id: 'player', label: nl.editor.speler, icoon: <SpelerIcon /> },
  { id: 'cone', label: nl.editor.pion, icoon: <PionIcon /> },
]

interface Props {
  kant: Side
  setKant: (side: Side) => void
}

/**
 * The controls, and only the controls. Who you are, what the diagram is called
 * and how it is doing live in the header above: state on one line, actions on
 * the next, so neither has to make room for the other.
 */
export function EditorToolbar({ kant, setKant }: Props) {
  const [paneelOpen, setPaneelOpen] = useState(false)

  const tool = useUiStore((s) => s.tool)
  const setTool = useUiStore((s) => s.setTool)
  const snap = useUiStore((s) => s.snap)
  const setSnap = useUiStore((s) => s.setSnap)
  const zoom = useUiStore((s) => s.zoom)
  const resetCamera = useUiStore((s) => s.resetCamera)

  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  const kanTerug = useDiagramStore(canUndo)
  const kanVooruit = useDiagramStore(canRedo)


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

          <Afspeelinstellingen />

          <div style={{ alignSelf: 'end' }}>
            <Aanvink label={nl.editor.rasterUitleg} checked={snap} onChange={setSnap} />
          </div>
        </div>
      )}

      <div className="editor-balk">
        <FrameNavigator />

        <div className="btn-groep">
          {TOOLS.map((t) => (
            <Knop
              key={t.id}
              klein
              actief={tool === t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              aria-label={t.label}
            >
              {t.icoon}
              <span className="knop-woord">{t.label}</span>
            </Knop>
          ))}
        </div>

        <div className="btn-groep">
          <Knop
            klein
            className="btn--icoon"
            onClick={undo}
            disabled={!kanTerug}
            title={nl.editor.ongedaan}
            aria-label={nl.editor.ongedaan}
          >
            <OngedaanIcon />
          </Knop>
          <Knop
            klein
            className="btn--icoon"
            onClick={redo}
            disabled={!kanVooruit}
            title={nl.editor.opnieuw}
            aria-label={nl.editor.opnieuw}
          >
            <OpnieuwIcon />
          </Knop>
        </div>

        <div className="editor-balk__rechts">
          {zoom > 1.01 && (
            <Knop klein onClick={resetCamera} title={nl.editor.zoomUit}>
              {Math.round(zoom * 100)}%
            </Knop>
          )}
          <Knop
            klein
            className="btn--icoon"
            actief={paneelOpen}
            aria-expanded={paneelOpen}
            aria-label={nl.instellingen.meer}
            title={nl.instellingen.meer}
            onClick={() => setPaneelOpen((o) => !o)}
          >
            <SchuivenIcon />
          </Knop>
        </div>
      </div>
    </div>
  )
}
