'use client'

import { useEffect } from 'react'
import { totaleDuur } from '@/lib/diagram/animation'
import { useDiagramStore } from './diagramStore'
import { useUiStore } from './uiStore'

/**
 * Drives the clock while the diagram plays.
 *
 * The speed multiplier only changes how fast this clock runs; the duration of
 * each frame belongs to the diagram and is saved with it.
 */
export function useAfspelen(): { totaal: number } {
  const duren = useDiagramStore((s) => s.doc.frames.map((f) => f.duurMs))
  const speelt = useUiStore((s) => s.speelt)
  const snelheid = useUiStore((s) => s.snelheid)
  const lussen = useUiStore((s) => s.lussen)

  const totaal = totaleDuur(duren)

  useEffect(() => {
    if (!speelt || totaal <= 0) return

    let vorige = performance.now()
    let handle = 0

    const stap = (nu: number) => {
      const delta = (nu - vorige) * snelheid
      vorige = nu

      const { tijdMs, setTijd, setSpeelt } = useUiStore.getState()
      const nieuw = tijdMs + delta

      if (nieuw >= totaal) {
        if (lussen) setTijd(nieuw % totaal)
        else {
          setTijd(totaal)
          setSpeelt(false)
          return
        }
      } else {
        setTijd(nieuw)
      }

      handle = requestAnimationFrame(stap)
    }

    handle = requestAnimationFrame(stap)
    return () => cancelAnimationFrame(handle)
  }, [speelt, snelheid, lussen, totaal])

  return { totaal }
}
