'use client'

import { useEffect, useState, type RefObject } from 'react'
import { UNITS_PER_METRE, type FieldView } from '@/lib/field/geometry'

/**
 * How many field metres one CSS pixel covers. Everything that has to keep a
 * constant size on screen -- token radius, hit areas, stroke widths -- is
 * derived from this instead of being hard-coded in metres.
 */
export function useMetresPerPixel(ref: RefObject<SVGSVGElement | null>, view: FieldView): number {
  const viewMetres = view.width / UNITS_PER_METRE
  const [metresPerPixel, setMetresPerPixel] = useState(viewMetres / 900)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const meet = () => {
      const width = element.getBoundingClientRect().width
      if (width > 0) setMetresPerPixel(viewMetres / width)
    }

    meet()
    const observer = new ResizeObserver(meet)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, viewMetres])

  return metresPerPixel
}
