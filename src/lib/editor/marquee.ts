import { buildLengthTable, pointAtDistance } from '@/lib/diagram/curve'
import { isVergrendeld, type Padvorm } from '@/lib/diagram/schema'
import type { Entity } from '@/lib/diagram/schema'
import type { Point } from '@/lib/field/geometry'

export interface Kader {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** Two opposite corners, in any order, become a rectangle. */
export function maakKader(a: Point, b: Point): Kader {
  return {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  }
}

export const kaderBreedte = (k: Kader) => k.maxX - k.minX
export const kaderHoogte = (k: Kader) => k.maxY - k.minY

export function puntInKader(p: Point, k: Kader): boolean {
  return p.x >= k.minX && p.x <= k.maxX && p.y >= k.minY && p.y <= k.maxY
}

/**
 * Does a circle touch the rectangle at all? Not "is it inside": a token half
 * caught by the marquee counts, which is what "everything the frame touches"
 * means.
 */
export function cirkelRaaktKader(midden: Point, straal: number, k: Kader): boolean {
  const dichtstbijX = Math.min(Math.max(midden.x, k.minX), k.maxX)
  const dichtstbijY = Math.min(Math.max(midden.y, k.minY), k.maxY)
  const dx = midden.x - dichtstbijX
  const dy = midden.y - dichtstbijY
  return dx * dx + dy * dy <= straal * straal
}

/** How finely a curve is checked against the marquee. */
const ARROW_SAMPLES = 60

export function arrowRaaktKader(
  punten: readonly Point[],
  k: Kader,
  vorm: Padvorm = 'vloeiend',
): boolean {
  if (punten.some((p) => puntInKader(p, k))) return true
  const table = buildLengthTable(punten, vorm)
  if (table.total === 0) return false
  for (let i = 0; i <= ARROW_SAMPLES; i++) {
    const { point } = pointAtDistance(table, (table.total * i) / ARROW_SAMPLES)
    if (puntInKader(point, k)) return true
  }
  return false
}

export function entiteitRaaktKader(entity: Entity, k: Kader, tokenStraal: number): boolean {
  switch (entity.type) {
    case 'player':
      return cirkelRaaktKader(entity.pos, tokenStraal, k)
    case 'cone':
      return cirkelRaaktKader(entity.pos, tokenStraal * 0.72, k)
    case 'arrow':
      return arrowRaaktKader(entity.path.points, k)
    case 'coneLine':
      return arrowRaaktKader(entity.path.points, k)
    case 'annotation': {
      // A zone is caught when the frame touches it anywhere, not only on one of
      // its two stored corners: you drag a box over a region, not over a dot.
      const xs = entity.points.map((p) => p.x)
      const ys = entity.points.map((p) => p.y)
      return (
        Math.min(...xs) <= k.maxX &&
        Math.max(...xs) >= k.minX &&
        Math.min(...ys) <= k.maxY &&
        Math.max(...ys) >= k.minY
      )
    }
    case 'text':
      return puntInKader(entity.pos, k)
  }
}

export function entiteitenInKader(
  entities: readonly Entity[],
  k: Kader,
  tokenStraal: number,
): string[] {
  // Pinned scenery stays out of it. A lock that still let a selection box pick
  // the thing up would only postpone the accident by one step.
  return entities
    .filter((e) => !isVergrendeld(e) && entiteitRaaktKader(e, k, tokenStraal))
    .map((e) => e.id)
}
