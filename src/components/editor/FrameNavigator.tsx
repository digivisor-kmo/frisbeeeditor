'use client'

import { Knop } from '@/components/ui/Knop'
import { PlusIcon, TerugIcon, VerderIcon } from './icons'
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
    <div className="framenav">
      <div className="btn-groep">
        <Knop
          klein
          className="btn--icoon"
          aria-label={nl.frames.vorige}
          title={nl.frames.vorige}
          disabled={activeFrame === 0}
          onClick={() => setActiveFrame(activeFrame - 1)}
        >
          <TerugIcon size={16} />
        </Knop>

        <span className="framenav__teller cijfers" aria-live="polite">
          <span className="framenav__nu">{activeFrame + 1}</span>
          <span className="framenav__streep">/</span>
          <span className="framenav__totaal">{frames.length}</span>
        </span>

        <Knop
          klein
          className="btn--icoon"
          aria-label={nl.frames.volgende}
          title={nl.frames.volgende}
          disabled={activeFrame >= frames.length - 1}
          onClick={() => setActiveFrame(activeFrame + 1)}
        >
          <VerderIcon size={16} />
        </Knop>
      </div>

      <Knop
        klein
        className="btn--icoon"
        disabled={!mag}
        title={reden}
        aria-label={nl.frames.toevoegenKort}
        onClick={() => setActiveFrame(voegFrameToe(activeFrame))}
      >
        <PlusIcon />
      </Knop>
    </div>
  )
}
