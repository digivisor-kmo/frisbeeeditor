'use client'

import { useMemo } from 'react'
import { Knop } from '@/components/ui/Knop'
import { frameOpTijd } from '@/lib/diagram/animation'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { useAfspelen } from '@/lib/editor/useAfspelen'
import { useUiStore } from '@/lib/editor/uiStore'
import { nl } from '@/lib/strings'
import { PauzeIcon, SpeelIcon } from './icons'

export function Afspeelbalk() {
  const frames = useDiagramStore((s) => s.doc.frames)
  const duren = useMemo(() => frames.map((f) => f.duurMs), [frames])
  const { totaal } = useAfspelen()

  const speelt = useUiStore((s) => s.speelt)
  const setSpeelt = useUiStore((s) => s.setSpeelt)
  const tijdMs = useUiStore((s) => s.tijdMs)
  const setTijd = useUiStore((s) => s.setTijd)
  const lussen = useUiStore((s) => s.lussen)
  const setLussen = useUiStore((s) => s.setLussen)
  const setActiveFrame = useUiStore((s) => s.setActiveFrame)
  const setScrubt = useUiStore((s) => s.setScrubt)

  if (totaal <= 0) return null

  return (
    <div className="afspeelbalk">
      <Knop
        variant="primair"
        className="speelknop"
        aria-label={speelt ? nl.afspelen.pauze : nl.afspelen.speel}
        title={speelt ? nl.afspelen.pauze : nl.afspelen.speel}
        onClick={() => {
          if (!speelt && tijdMs >= totaal) setTijd(0)
          setSpeelt(!speelt)
        }}
      >
        {speelt ? <PauzeIcon size={17} /> : <SpeelIcon size={17} />}
      </Knop>

      <input
        type="range"
        className="scrubber"
        aria-label={nl.afspelen.scrubber}
        min={0}
        max={totaal}
        step={10}
        // The filled part of the track is the position, so it has to follow the
        // value rather than sit at a fixed width.
        style={
          {
            '--voortgang': `${totaal > 0 ? (Math.min(tijdMs, totaal) / totaal) * 100 : 0}%`,
          } as React.CSSProperties
        }
        value={Math.min(tijdMs, totaal)}
        onPointerDown={() => setScrubt(true)}
        onPointerUp={() => setScrubt(false)}
        onBlur={() => setScrubt(false)}
        onChange={(e) => {
          const waarde = Number(e.target.value)
          setTijd(waarde)
          // Scrubbing moves the editor to the frame you land in, so stopping
          // playback never leaves you editing a different frame than you see.
          setActiveFrame(frameOpTijd(duren, waarde).index)
        }}
      />

      <Knop klein actief={lussen} onClick={() => setLussen(!lussen)}>
        {nl.afspelen.lussen}
      </Knop>
    </div>
  )
}
