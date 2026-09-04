'use client'

import { Knop } from '@/components/ui/Knop'
import { frameOpTijd } from '@/lib/diagram/animation'
import { useDiagramStore } from '@/lib/editor/diagramStore'
import { useAfspelen } from '@/lib/editor/useAfspelen'
import { useUiStore } from '@/lib/editor/uiStore'
import { nl } from '@/lib/strings'

const SNELHEDEN = [0.5, 1, 1.5, 2]

export function Afspeelbalk() {
  const duren = useDiagramStore((s) => s.doc.frames.map((f) => f.duurMs))
  const { totaal } = useAfspelen()

  const speelt = useUiStore((s) => s.speelt)
  const setSpeelt = useUiStore((s) => s.setSpeelt)
  const tijdMs = useUiStore((s) => s.tijdMs)
  const setTijd = useUiStore((s) => s.setTijd)
  const snelheid = useUiStore((s) => s.snelheid)
  const setSnelheid = useUiStore((s) => s.setSnelheid)
  const lussen = useUiStore((s) => s.lussen)
  const setLussen = useUiStore((s) => s.setLussen)
  const focus = useUiStore((s) => s.focus)
  const setFocus = useUiStore((s) => s.setFocus)
  const setActiveFrame = useUiStore((s) => s.setActiveFrame)
  const setScrubt = useUiStore((s) => s.setScrubt)

  if (totaal <= 0) return null

  const { index } = frameOpTijd(duren, tijdMs)

  return (
    <div className="afspeelbalk">
      <Knop
        klein
        variant={speelt ? 'standaard' : 'primair'}
        aria-label={speelt ? nl.afspelen.pauze : nl.afspelen.speel}
        onClick={() => {
          if (!speelt && tijdMs >= totaal) setTijd(0)
          setSpeelt(!speelt)
        }}
      >
        {speelt ? '❚❚' : '▶'}
      </Knop>

      <input
        type="range"
        className="scrubber"
        aria-label={nl.afspelen.scrubber}
        min={0}
        max={totaal}
        step={10}
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

      <span className="stil" style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {nl.frames.kort} {index + 1}
      </span>

      <div className="btn-groep">
        {SNELHEDEN.map((s) => (
          <Knop key={s} klein actief={snelheid === s} onClick={() => setSnelheid(s)}>
            {s.toLocaleString('nl-BE')}×
          </Knop>
        ))}
      </div>

      <Knop klein actief={lussen} onClick={() => setLussen(!lussen)}>
        {nl.afspelen.lussen}
      </Knop>

      <div className="btn-groep">
        {(['beide', 'offense', 'defense'] as const).map((f) => (
          <Knop key={f} klein actief={focus === f} onClick={() => setFocus(f)}>
            {f === 'beide' ? nl.afspelen.beide : f === 'offense' ? nl.editor.aanval : nl.editor.verdediging}
          </Knop>
        ))}
      </div>
    </div>
  )
}
