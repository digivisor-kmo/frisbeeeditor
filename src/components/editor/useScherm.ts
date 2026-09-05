'use client'

import { useEffect, useState } from 'react'

export interface Scherm {
  /** A phone, judged by its short side rather than its width, so a rotated one stays a phone. */
  telefoon: boolean
  liggend: boolean
}

function lees(): Scherm {
  if (typeof window === 'undefined') return { telefoon: false, liggend: true }
  const kort = Math.min(window.innerWidth, window.innerHeight)
  return { telefoon: kort <= 560, liggend: window.innerWidth >= window.innerHeight }
}

/**
 * What kind of screen this is, and which way up.
 *
 * The short side decides whether it is a phone: a phone turned sideways is
 * still a phone, and a tablet in portrait is still a tablet. Judging by width
 * alone would give a landscape phone the desktop layout and a portrait tablet
 * the phone one, which is exactly backwards.
 */
export function useScherm(): Scherm {
  const [scherm, setScherm] = useState<Scherm>({ telefoon: false, liggend: true })

  useEffect(() => {
    const meet = () => setScherm(lees())
    meet()
    window.addEventListener('resize', meet)
    window.addEventListener('orientationchange', meet)
    return () => {
      window.removeEventListener('resize', meet)
      window.removeEventListener('orientationchange', meet)
    }
  }, [])

  return scherm
}
