'use client'

import { Knop } from '@/components/ui/Knop'
import { kanFrameToevoegen, MAX_FRAMES } from '@/lib/diagram/frames'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { useUiStore } from '@/lib/editor/uiStore'
import { nl } from '@/lib/strings'

export function FrameNavigator() {
  const frames = useDiagramStore((s) => s.doc.frames)
  const voegFrameToe = useDiagramStore((s) => s.voegFrameToe)
  const activeFrame = useUiStore((s) => s.activeFrame)
  const setActiveFrame = useUiStore((s) => s.setActiveFrame)

  const huidig = frames[activeFrame]
  const mag = huidig ? kanFrameToevoegen(huidig.content, frames.length) : false

  const reden = !huidig
    ? ''
    : frames.length >= MAX_FRAMES
      ? nl.frames.maximum
      : mag
        ? nl.frames.toevoegen
        : nl.frames.geenBeweging

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ruimte-2)' }}>
      <div className="btn-groep">
        <Knop
          klein
          aria-label={nl.frames.vorige}
          disabled={activeFrame === 0}
          onClick={() => setActiveFrame(activeFrame - 1)}
        >
          ‹
        </Knop>
        <Knop
          klein
          aria-label={nl.frames.volgende}
          disabled={activeFrame >= frames.length - 1}
          onClick={() => setActiveFrame(activeFrame + 1)}
        >
          ›
        </Knop>
      </div>

      <span
        style={{
          fontSize: 'var(--tekst-sm)',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        {nl.frames.kort} {activeFrame + 1}/{frames.length}
      </span>

      <Knop klein disabled={!mag} title={reden} onClick={() => setActiveFrame(voegFrameToe(activeFrame))}>
        + {nl.frames.frame}
      </Knop>
    </div>
  )
}
