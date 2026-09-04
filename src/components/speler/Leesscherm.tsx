'use client'

import { useEffect, useMemo } from 'react'
import { DiagramThumbnail } from '@/components/field/DiagramThumbnail'
import { Afspeelbalk } from '@/components/editor/Afspeelbalk'
import type { Weergave } from '@/lib/diagram/schema'
import type { EditorDoc } from '@/lib/editor/document'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { useUiStore } from '@/lib/editor/uiStore'
import { nl } from '@/lib/strings'
import { LeesCanvas } from './LeesCanvas'

/**
 * What a player gets: the diagram, the play button, and the note under it.
 *
 * The playback machinery is shared with the editor on purpose. The animation is
 * the thing this whole application is for, and two copies of it would be two
 * animations within a month.
 */
export function Leesscherm({ doc }: { doc: EditorDoc }) {
  const load = useDiagramStore((s) => s.load)
  const frames = useDiagramStore((s) => s.doc.frames)
  const geladenId = useDiagramStore((s) => s.doc.id)

  const activeFrame = useUiStore((s) => s.activeFrame)
  const setActiveFrame = useUiStore((s) => s.setActiveFrame)
  const speelt = useUiStore((s) => s.speelt)
  const scrubt = useUiStore((s) => s.scrubt)
  const tijdMs = useUiStore((s) => s.tijdMs)
  const focus = useUiStore((s) => s.focus)

  useEffect(() => {
    load(doc)
    useUiStore.setState({ activeFrame: 0, tijdMs: 0, speelt: false, selection: new Set() })
  }, [load, doc])

  const toelichting = useMemo(
    () => frames[activeFrame]?.toelichting?.trim() ?? '',
    [frames, activeFrame],
  )

  if (geladenId !== doc.id) return null

  return (
    <>
      <div className="kaart veld-kaart lees-veld">
        <LeesCanvas
          frames={frames}
          weergave={doc.meta.weergave}
          stijl={doc.meta.tokenstijl}
          activeFrame={activeFrame}
          speelt={speelt}
          scrubt={scrubt}
          tijdMs={tijdMs}
          focus={focus}
        />
      </div>

      {toelichting !== '' && <p className="lees-toelichting">{toelichting}</p>}

      {frames.length > 1 && (
        <div className="lees-frames">
          {frames.map((frame, index) => (
            <button
              key={frame.id}
              type="button"
              className="frame-thumb"
              data-actief={index === activeFrame ? 'ja' : undefined}
              aria-label={`${nl.frames.frame} ${index + 1}`}
              aria-current={index === activeFrame}
              onClick={() => setActiveFrame(index)}
            >
              <span className="frame-thumb__veld">
                <DiagramThumbnail
                  content={frame.content}
                  weergave={doc.meta.weergave as Weergave}
                />
              </span>
              <span className="frame-thumb__nummer">{index + 1}</span>
            </button>
          ))}
        </div>
      )}

      <div className="lees-balk">
        <Afspeelbalk />
      </div>
    </>
  )
}
