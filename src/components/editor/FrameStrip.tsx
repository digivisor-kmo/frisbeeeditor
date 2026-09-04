'use client'

import { useRef, useState } from 'react'
import { DiagramThumbnail } from '@/components/field/DiagramThumbnail'
import { Knop } from '@/components/ui/Knop'
import { DEFAULT_FRAME_DURATION_MS } from '@/lib/editor/document'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { useUiStore } from '@/lib/editor/uiStore'
import { nl } from '@/lib/strings'
import { Afspeelbalk } from './Afspeelbalk'
import type { Weergave } from '@/lib/diagram/schema'

const DUUR_STAPPEN = [750, 1000, 1500, 2000, 3000]

export function FrameStrip() {
  const frames = useDiagramStore((s) => s.doc.frames)
  const weergave = useDiagramStore((s) => s.doc.meta.weergave)
  const verplaatsFrame = useDiagramStore((s) => s.verplaatsFrame)
  const verwijderFrame = useDiagramStore((s) => s.verwijderFrame)
  const dupliceerFrame = useDiagramStore((s) => s.dupliceerFrame)
  const zetFrameDuur = useDiagramStore((s) => s.zetFrameDuur)

  const activeFrame = useUiStore((s) => s.activeFrame)
  const setActiveFrame = useUiStore((s) => s.setActiveFrame)

  const sleep = useRef<{ van: number; pointerId: number } | null>(null)
  const [sleepend, setSleepend] = useState(false)
  const [doelIndex, setDoelIndex] = useState<number | null>(null)

  if (frames.length < 2) return null

  const huidig = frames[activeFrame]
  const volgende = Math.max(0, frames.length - 1 - activeFrame)

  function indexOnder(clientX: number, container: HTMLElement): number {
    const kinderen = [...container.querySelectorAll('[data-frame-index]')] as HTMLElement[]
    for (const kind of kinderen) {
      const rect = kind.getBoundingClientRect()
      if (clientX < rect.left + rect.width / 2) return Number(kind.dataset.frameIndex)
    }
    return kinderen.length - 1
  }

  return (
    <div className="frame-strip">
      <Afspeelbalk />
      <div className="frame-strip__onder">
      <div
        className="frame-strip__rij"
        onPointerMove={(event) => {
          const state = sleep.current
          if (!state || state.pointerId !== event.pointerId) return
          setDoelIndex(indexOnder(event.clientX, event.currentTarget))
        }}
        onPointerUp={(event) => {
          const state = sleep.current
          if (state && doelIndex !== null && doelIndex !== state.van) {
            verplaatsFrame(state.van, doelIndex)
            setActiveFrame(doelIndex)
          }
          sleep.current = null
          setSleepend(false)
          setDoelIndex(null)
          event.currentTarget.releasePointerCapture?.(event.pointerId)
        }}
        onPointerCancel={() => {
          sleep.current = null
          setSleepend(false)
          setDoelIndex(null)
        }}
      >
        {frames.map((frame, index) => (
          <button
            key={frame.id}
            type="button"
            data-frame-index={index}
            className="frame-thumb"
            data-actief={index === activeFrame ? 'ja' : undefined}
            data-doel={sleepend && doelIndex === index ? 'ja' : undefined}
            aria-label={`${nl.frames.frame} ${index + 1}`}
            aria-current={index === activeFrame}
            onClick={() => setActiveFrame(index)}
            onPointerDown={(event) => {
              sleep.current = { van: index, pointerId: event.pointerId }
              setSleepend(true)
              event.currentTarget.parentElement?.setPointerCapture?.(event.pointerId)
            }}
          >
            <span className="frame-thumb__veld">
              <DiagramThumbnail content={frame.content} weergave={weergave as Weergave} />
            </span>
            <span className="frame-thumb__nummer">{index + 1}</span>
          </button>
        ))}
      </div>

      <div className="frame-strip__acties">
        {/* Editing an earlier frame is not a local act. Say it here, where the
            frames themselves are, and quietly: it is context, not a warning. */}
        {volgende > 0 && (
          <span className="werkt-door" title={nl.frames.werktDoorUitleg}>
            {nl.frames.werktDoor(volgende)}
          </span>
        )}

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="stil" style={{ fontSize: 'var(--tekst-xs)' }}>
            {nl.frames.duur}
          </span>
          <select
            className="keuze"
            style={{ minHeight: 36, width: 'auto' }}
            value={huidig?.duurMs ?? DEFAULT_FRAME_DURATION_MS}
            onChange={(e) => zetFrameDuur(activeFrame, Number(e.target.value))}
          >
            {DUUR_STAPPEN.map((ms) => (
              <option key={ms} value={ms}>
                {(ms / 1000).toLocaleString('nl-BE')} s
              </option>
            ))}
          </select>
        </label>

        <Knop klein onClick={() => setActiveFrame(dupliceerFrame(activeFrame))}>
          {nl.frames.dupliceren}
        </Knop>
        <Knop
          klein
          variant="gevaar"
          disabled={frames.length <= 1}
          onClick={() => {
            verwijderFrame(activeFrame)
            setActiveFrame(Math.max(0, activeFrame - 1))
          }}
        >
          {nl.frames.verwijderen}
        </Knop>
      </div>
      </div>
    </div>
  )
}
