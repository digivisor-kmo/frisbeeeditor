'use client'

import { useEffect, useState, type RefObject } from 'react'
import { UNITS_PER_METRE, type Camera } from '@/lib/field/geometry'

/**
 * How many field metres one CSS pixel covers, at the current zoom.
 *
 * Everything that has to keep a constant size on screen -- token radius, hit
 * areas, stroke widths -- is derived from this instead of being hard-coded in
 * metres.
 */
export function useMetresPerPixel(ref: RefObject<SVGSVGElement | null>, camera: Camera): number {
  const zichtbareMeters = camera.width / UNITS_PER_METRE
  const [breedtePx, setBreedtePx] = useState(900)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const meet = () => {
      const breedte = element.getBoundingClientRect().width
      if (breedte > 0) setBreedtePx(breedte)
    }

    meet()
    const observer = new ResizeObserver(meet)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return zichtbareMeters / breedtePx
}

/**
 * True on a narrow screen held upright. The full field is 100 metres wide; on a
 * phone in portrait that is three and a half pixels per metre, so the field is
 * drawn turned a quarter instead. Nothing about the stored positions changes.
 */
export function useStaandScherm(): boolean {
  const [staand, setStaand] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 720px) and (orientation: portrait)')
    const update = () => setStaand(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return staand
}
