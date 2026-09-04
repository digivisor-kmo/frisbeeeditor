'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { claimSlot, geefSlotVrij, SLOT_HERHAAL_MS } from '@/lib/data/vergrendeling'

export type SlotStatus = 'uit' | 'bezig' | 'vergrendeld' | 'bezet' | 'verloren' | 'fout'

export interface Vergrendeling {
  status: SlotStatus
  /** Who is holding it, when it is not you. */
  houder: string | null
  fout: string | null
  opnieuw: () => void
}

/**
 * Holds the lock on a diagram for as long as this tab is actually being used.
 *
 * The heartbeat only runs while the tab is visible, so a phone that goes into a
 * pocket stops renewing and the lock falls free by itself. Coming back checks
 * straight away, which is the moment you find out whether it is still yours.
 */
export function useVergrendeling(diagramId: string | null, actief: boolean): Vergrendeling {
  const [status, setStatus] = useState<SlotStatus>('bezig')
  const [houder, setHouder] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [poging, setPoging] = useState(0)

  // Once lost, stay lost until the page is left: silently taking the lock back
  // would let two people believe they are both editing.
  const verloren = useRef(false)

  const opnieuw = useCallback(() => {
    verloren.current = false
    setStatus('bezig')
    setPoging((n) => n + 1)
  }, [])

  useEffect(() => {
    // A player never takes a lock: he cannot change anything anyway.
    if (!diagramId || !actief) return
    verloren.current = false

    let gestopt = false

    const probeer = async () => {
      if (gestopt || verloren.current) return
      try {
        const slot = await claimSlot(diagramId)
        if (gestopt) return
        if (slot.gelukt) {
          setStatus('vergrendeld')
          setHouder(null)
          setFout(null)
          return
        }
        setHouder(slot.naam)
        // Losing it while you were already in is a different message than
        // arriving at a diagram somebody else already had open.
        setStatus((huidig) => {
          if (huidig === 'vergrendeld') {
            verloren.current = true
            return 'verloren'
          }
          return 'bezet'
        })
      } catch (error) {
        if (gestopt) return
        setFout(error instanceof Error ? error.message : String(error))
        setStatus('fout')
      }
    }

    void probeer()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void probeer()
    }, SLOT_HERHAAL_MS)

    const bijZichtbaar = () => {
      if (document.visibilityState === 'visible') void probeer()
    }
    document.addEventListener('visibilitychange', bijZichtbaar)

    // Leaving the page hands the lock back at once, so the next person does not
    // have to wait out the two minutes.
    const bijVertrek = () => {
      void geefSlotVrij(diagramId)
    }
    window.addEventListener('pagehide', bijVertrek)

    return () => {
      gestopt = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', bijZichtbaar)
      window.removeEventListener('pagehide', bijVertrek)
      void geefSlotVrij(diagramId)
    }
  }, [diagramId, actief, poging])

  // Derived rather than stored, so there is one source of truth for whether
  // locking applies at all.
  return { status: actief && diagramId ? status : 'uit', houder, fout, opnieuw }
}
