'use client'

import { useLayoutEffect, useState, type RefObject } from 'react'

export type Richting = 'boven' | 'onder'

/** How much breathing room a floating panel keeps from the window edge. */
const MARGE = 12

/**
 * Which side of its anchor a floating panel should open on.
 *
 * The decision is made from the anchor and the panel's own height, never from
 * the direction it currently has, so it settles in one pass instead of flipping
 * back and forth.
 */
export function useOmklappen(
  ankerRef: RefObject<HTMLElement | null>,
  paneelRef: RefObject<HTMLElement | null>,
  open: boolean,
  voorkeur: Richting,
): Richting {
  const [richting, setRichting] = useState<Richting>(voorkeur)

  useLayoutEffect(() => {
    if (!open) return
    const anker = ankerRef.current?.getBoundingClientRect()
    if (!anker) return

    const hoogte = paneelRef.current?.offsetHeight ?? 0
    const ruimteOnder = window.innerHeight - anker.bottom - MARGE
    const ruimteBoven = anker.top - MARGE

    const past = voorkeur === 'onder' ? hoogte <= ruimteOnder : hoogte <= ruimteBoven
    const meerRuimte = ruimteOnder >= ruimteBoven ? 'onder' : 'boven'

    // De gerenderde hoogte van het paneel is pas na de layout te meten.
    setRichting(past ? voorkeur : meerRuimte)
  }, [open, voorkeur, ankerRef, paneelRef])

  return richting
}
