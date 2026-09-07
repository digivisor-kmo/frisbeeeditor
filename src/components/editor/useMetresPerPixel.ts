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
 * How big the drawing surface is on screen, in CSS pixels.
 *
 * Not the same as the field: an SVG letterboxes its drawing inside its box, so
 * a wide pitch in a squarer window leaves bands above and below. Anything
 * floating over the canvas — the arc menu, its panel — is positioned in that
 * box and has to be placed against the box, not against the pitch inside it.
 */
export function useElementGrootte(ref: RefObject<Element | null>): {
  breedte: number
  hoogte: number
} {
  const [grootte, setGrootte] = useState({ breedte: 900, hoogte: 520 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const meet = () => {
      const rect = element.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setGrootte((vorig) =>
          Math.abs(vorig.breedte - rect.width) < 0.5 && Math.abs(vorig.hoogte - rect.height) < 0.5
            ? vorig
            : { breedte: rect.width, hoogte: rect.height },
        )
      }
    }

    meet()
    const observer = new ResizeObserver(meet)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return grootte
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
