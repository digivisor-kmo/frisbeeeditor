import { buildLengthTable, pointAtDistance } from '@/lib/diagram/curve'
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

export function arrowRaaktKader(punten: readonly Point[], k: Kader): boolean {
  if (punten.some((p) => puntInKader(p, k))) return true
  const table = buildLengthTable(punten)
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
    case 'annotation':
      return entity.points.some((p) => puntInKader(p, k))
    case 'text':
      return puntInKader(entity.pos, k)
  }
}

export function entiteitenInKader(
  entities: readonly Entity[],
  k: Kader,
  tokenStraal: number,
): string[] {
  return entities.filter((e) => entiteitRaaktKader(e, k, tokenStraal)).map((e) => e.id)
}
