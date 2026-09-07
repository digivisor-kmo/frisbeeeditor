import { nextZ } from './entities'
import type { Annotation, Entity, Point, TextBlock, TokenColor } from './schema'

/**
 * Regions and notes on the pitch.
 *
 * A zone is stored as two opposite corners, in whatever order they were drawn,
 * so the maths that reads it always normalises first. Everything here is in
 * metres, like the rest of the field.
 */

/** Smaller than this and there is nothing left to grab or to read. */
export const MIN_ZONE_M = 1.5

/** What a tap rather than a drag gives you: a region you can already see. */
export const STANDAARD_ZONE_M = { breedte: 14, hoogte: 10 }

export interface Kader {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function zoneKader(zone: Annotation): Kader {
  const [a, b] = [zone.points[0]!, zone.points[zone.points.length - 1]!]
  return {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  }
}

export function zoneMidden(zone: Annotation): Point {
  const k = zoneKader(zone)
  return { x: (k.minX + k.maxX) / 2, y: (k.minY + k.maxY) / 2 }
}

/** True when the point is inside the shape, which is not the same as its box. */
export function inZone(zone: Annotation, punt: Point): boolean {
  const k = zoneKader(zone)
  if (zone.shape !== 'ellipse') {
    return punt.x >= k.minX && punt.x <= k.maxX && punt.y >= k.minY && punt.y <= k.maxY
  }
  const rx = Math.max((k.maxX - k.minX) / 2, 1e-6)
  const ry = Math.max((k.maxY - k.minY) / 2, 1e-6)
  const cx = (k.minX + k.maxX) / 2
  const cy = (k.minY + k.maxY) / 2
  return ((punt.x - cx) / rx) ** 2 + ((punt.y - cy) / ry) ** 2 <= 1
}

export function createZone(options: {
  id: string
  shape: 'rect' | 'ellipse'
  van: Point
  tot: Point
  color?: TokenColor
  entities: readonly Entity[]
}): Annotation {
  return {
    id: options.id,
    type: 'annotation',
    // Zones sit under everything, so their own order among themselves is all
    // that this decides.
    z: nextZ(options.entities),
    shape: options.shape,
    points: [{ ...options.van }, { ...options.tot }],
    style: {
      stroke: options.color ?? 'standaard',
      width: 0.28,
      fill: options.color ?? 'standaard',
      dash: true,
      opacity: 0.16,
    },
  }
}

export const TEXT_SIZES_M: Record<TextBlock['size'], number> = {
  sm: 1.5,
  md: 2.1,
  lg: 3,
}

export function createText(options: {
  id: string
  pos: Point
  content: string
  entities: readonly Entity[]
}): TextBlock {
  return {
    id: options.id,
    type: 'text',
    z: nextZ(options.entities),
    pos: { ...options.pos },
    content: options.content,
    size: 'md',
    weight: 'halfvet',
    color: 'standaard',
    align: 'midden',
  }
}
