'use client'

import { Knop } from '@/components/ui/Knop'
import { useUiStore } from '@/lib/editor/uiStore'
import { nl } from '@/lib/strings'

const SNELHEDEN = [0.5, 1, 1.5, 2]

/**
 * Speed and focus, in the panel where the project brief puts them.
 *
 * They are viewing settings you touch once and then leave alone, and on a phone
 * they were eating a third of the screen out of the bar that has to stay.
 */
export function Afspeelinstellingen({ kort = false }: { kort?: boolean }) {
  const snelheid = useUiStore((s) => s.snelheid)
  const setSnelheid = useUiStore((s) => s.setSnelheid)
  const focus = useUiStore((s) => s.focus)
  const setFocus = useUiStore((s) => s.setFocus)

  return (
    <>
      <div className="paneel-veld">
        <span className="veld-label">{nl.afspelen.snelheid}</span>
        <div className="btn-groep">
          {SNELHEDEN.map((s) => (
            <Knop key={s} klein actief={snelheid === s} onClick={() => setSnelheid(s)}>
              {s.toLocaleString('nl-BE')}×
            </Knop>
          ))}
        </div>
      </div>

      <div className="paneel-veld">
        {/* Under a heading that already says Afspelen, the long version of this
            label wraps to two lines and says nothing extra. */}
        <span className="veld-label">{kort ? nl.afspelen.focusKort : nl.afspelen.focus}</span>
        <div className="btn-groep">
          {(['beide', 'offense', 'defense'] as const).map((f) => (
            <Knop key={f} klein actief={focus === f} onClick={() => setFocus(f)}>
              {f === 'beide' ? nl.afspelen.beide : f === 'offense' ? nl.editor.aanval : nl.editor.verdediging}
            </Knop>
          ))}
        </div>
      </div>
    </>
  )
}
