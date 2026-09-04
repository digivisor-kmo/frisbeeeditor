'use client'

import { useEffect, useMemo } from 'react'
import { frameOpTijd, totaleDuur } from '@/lib/diagram/animation'
import { useDiagramStore } from './diagramStore'
import { useUiStore } from './uiStore'

/**
 * How long the final position stays on screen before a loop starts over, in
 * milliseconds. Without it the last pose is gone the instant it arrives, which
 * is exactly the moment you want to look at. It is a viewing setting like the
 * speed multiplier, so it is not stored with the diagram.
 */
const LUS_PAUZE_MS = 600

/**
 * Drives the clock while the diagram plays.
 *
 * The speed multiplier only changes how fast this clock runs; the duration of
 * each frame belongs to the diagram and is saved with it.
 */
export function useAfspelen(): { totaal: number } {
  // Deriving inside the selector would hand Zustand a fresh array on every
  // read, which it sees as a change, which re-renders, which reads again.
  const frames = useDiagramStore((s) => s.doc.frames)
  const duren = useMemo(() => frames.map((f) => f.duurMs), [frames])
  const speelt = useUiStore((s) => s.speelt)
  const snelheid = useUiStore((s) => s.snelheid)
  const lussen = useUiStore((s) => s.lussen)

  const totaal = totaleDuur(duren)
  const activeFrame = useUiStore((s) => s.activeFrame)

  // Stepping to another frame moves the playhead there. Without this the
  // navigator says frame 2 while the play bar says frame 1, and two counters
  // that contradict each other are worse than one.
  useEffect(() => {
    const { speelt: loopt, scrubt, tijdMs, setTijd } = useUiStore.getState()
    if (loopt || scrubt) return
    const start = Math.min(
      duren.slice(0, activeFrame).reduce((som, ms) => som + ms, 0),
      totaleDuur(duren),
    )
    if (Math.abs(tijdMs - start) > 1) setTijd(start)
  }, [activeFrame, duren])

  useEffect(() => {
    if (!speelt || totaal <= 0) return

    let vorige = performance.now()
    let handle = 0
    let pauze = 0

    const stap = (nu: number) => {
      const delta = (nu - vorige) * snelheid
      vorige = nu

      const { tijdMs, setTijd, setSpeelt, activeFrame, setActiveFrame } = useUiStore.getState()

      // Holding the last pose before the loop starts over.
      if (pauze > 0) {
        pauze -= delta
        if (pauze <= 0) {
          pauze = 0
          setTijd(0)
        }
        handle = requestAnimationFrame(stap)
        return
      }

      const nieuw = tijdMs + delta

      if (nieuw >= totaal) {
        setTijd(totaal)
        // Stopping leaves you editing the pose you are looking at, not the
        // frame you happened to press play in.
        if (activeFrame !== duren.length - 1) setActiveFrame(duren.length - 1)
        if (lussen) {
          pauze = LUS_PAUZE_MS
        } else {
          setSpeelt(false)
          return
        }
      } else {
        setTijd(nieuw)
        const { index } = frameOpTijd(duren, nieuw)
        if (index !== activeFrame) setActiveFrame(index)
      }

      handle = requestAnimationFrame(stap)
    }

    handle = requestAnimationFrame(stap)
    return () => cancelAnimationFrame(handle)
  }, [speelt, snelheid, lussen, totaal, duren])

  return { totaal }
}
