import { FIELD_M } from '@/lib/field/geometry'
import type { Point } from '@/lib/field/geometry'
import { nextZ } from './entities'
import { isPlayer, type Arrow, type ArrowKind, type Entity, type ThrowType, type Weergave } from './schema'

/**
 * Length of a freshly drawn arrow, in metres.
 *
 * Long enough that the point sits clear of the token and is easy to grab, and
 * short enough that it does not shoot across the field before you aim it. A
 * real cut is ten to twenty metres, so this is also a plausible starting shape.
 */
export const NIEUWE_ARROW_LENGTE_M = 12

/** A throw endpoint within this distance of a player locks onto him. */
export const THROW_SNAP_M = 1.5

/**
 * Which way the offence is moving in this view. A new arrow points that way,
 * because that is where a cut or a throw almost always goes.
 */
export function aanvalsRichting(weergave: Weergave): Point {
  // Half field: portrait, endzone at the top, so the offence attacks towards x = 0.
  if (weergave === 'half') return { x: -1, y: 0 }
  return { x: 1, y: 0 }
}

/**
 * How strongly each throw bends, as a fraction of its length, and which way.
 * Positive bends towards the far sideline. A trainer can drag it anywhere
 * afterwards; this only decides where the curve starts out.
 */
export const THROW_KROMMING: Record<ThrowType, number> = {
  backhand: 0.18,
  forehand: -0.18,
  hammer: 0.34,
  scoober: -0.34,
  blade: 0.1,
}

export const THROW_LABELS: Record<ThrowType, string> = {
  backhand: 'Backhand',
  forehand: 'Forehand',
  hammer: 'Hammer',
  scoober: 'Scoober',
  blade: 'Blade',
}

export const THROW_TYPES: readonly ThrowType[] = [
  'backhand',
  'forehand',
  'hammer',
  'scoober',
  'blade',
]

function klem(p: Point): Point {
  return {
    x: Math.min(Math.max(p.x, 0), FIELD_M.length),
    y: Math.min(Math.max(p.y, 0), FIELD_M.width),
  }
}

export function createArrow(options: {
  id: string
  ownerId: string
  van: Point
  kind: ArrowKind
  weergave: Weergave
  entities: readonly Entity[]
  throwType?: ThrowType
}): Arrow {
  const richting = aanvalsRichting(options.weergave)
  const eind = klem({
    x: options.van.x + richting.x * NIEUWE_ARROW_LENGTE_M,
    y: options.van.y + richting.y * NIEUWE_ARROW_LENGTE_M,
  })

  const punten: Point[] = [options.van, eind]

  if (options.kind === 'throw') {
    const throwType = options.throwType ?? 'backhand'
    const kromming = THROW_KROMMING[throwType]
    const midden = { x: (options.van.x + eind.x) / 2, y: (options.van.y + eind.y) / 2 }
    const dx = eind.x - options.van.x
    const dy = eind.y - options.van.y
    const lengte = Math.hypot(dx, dy) || 1
    // Perpendicular to the direction of travel.
    const bocht = klem({
      x: midden.x - (dy / lengte) * lengte * kromming,
      y: midden.y + (dx / lengte) * lengte * kromming,
    })
    punten.splice(1, 0, bocht)

    return {
      id: options.id,
      type: 'arrow',
      z: nextZ(options.entities),
      kind: 'throw',
      ownerId: options.ownerId,
      path: { points: punten },
      throwType,
    }
  }

  return {
    id: options.id,
    type: 'arrow',
    z: nextZ(options.entities),
    kind: options.kind,
    ownerId: options.ownerId,
    path: { points: punten },
  }
}

/**
 * A throw ends at a receiver, so its endpoint locks onto a nearby player. A cut
 * ends in open space and must never snap: that is the whole point of a cut.
 */
export function snapThrowEnd(
  pos: Point,
  entities: readonly Entity[],
  ownerId: string,
): { pos: Point; targetId?: string } {
  let beste: { pos: Point; id: string; afstand: number } | null = null

  for (const entity of entities) {
    if (!isPlayer(entity) || entity.id === ownerId) continue
    const afstand = Math.hypot(entity.pos.x - pos.x, entity.pos.y - pos.y)
    if (afstand > THROW_SNAP_M) continue
    if (!beste || afstand < beste.afstand) {
      beste = { pos: entity.pos, id: entity.id, afstand }
    }
  }

  if (!beste) return { pos }
  return { pos: beste.pos, targetId: beste.id }
}

/** Moves a whole arrow along with the player it belongs to. */
export function verplaatsArrow(arrow: Arrow, delta: Point): void {
  for (const punt of arrow.path.points) {
    punt.x += delta.x
    punt.y += delta.y
  }
}

export const arrowStart = (arrow: Arrow): Point => arrow.path.points[0]!
export const arrowEnd = (arrow: Arrow): Point => arrow.path.points[arrow.path.points.length - 1]!

/**
 * How many bends one arrow may carry. There is no rule that needs a limit, but
 * past a handful the handles start covering each other and nothing on a field
 * needs that many.
 */
export const MAX_BOCHTEN = 8

/** The bend points: everything between the start and the end. */
export const arrowBochten = (arrow: Arrow): Point[] => arrow.path.points.slice(1, -1)

/** Indices of the bend points inside `path.points`. */
export const bochtIndices = (arrow: Arrow): number[] =>
  arrow.path.points.slice(1, -1).map((_, i) => i + 1)

/** Number of segments, which is also the number of small invitation handles. */
export const segmentAantal = (arrow: Arrow): number => arrow.path.points.length - 1

/**
 * Turns the small handle in the middle of segment `segmentIndex` into a real
 * bend point. Mutates an immer draft and returns the index of the new point.
 */
export function voegBochtToe(arrow: Arrow, segmentIndex: number, punt: Point): number | null {
  if (arrowBochten(arrow).length >= MAX_BOCHTEN) return null
  const index = Math.min(Math.max(segmentIndex + 1, 1), arrow.path.points.length - 1)
  arrow.path.points.splice(index, 0, punt)
  return index
}

export function verwijderBocht(arrow: Arrow, puntIndex: number): boolean {
  if (puntIndex < 1 || puntIndex > arrow.path.points.length - 2) return false
  arrow.path.points.splice(puntIndex, 1)
  return true
}

export const ARROW_LABELS: Record<ArrowKind, string> = {
  cut: 'Cut',
  throw: 'Worp',
  juke: 'Juke',
  sight: 'Zichtlijn',
}

/** Which arrows this player can draw right now. */
export function tekenbareArrows(heeftSchijf: boolean): ArrowKind[] {
  return heeftSchijf ? ['cut', 'juke', 'throw'] : ['cut', 'juke']
}
