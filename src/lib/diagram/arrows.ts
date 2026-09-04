import { FIELD_M } from '@/lib/field/geometry'
import type { Point } from '@/lib/field/geometry'
import { nextZ } from './entities'
import {
  isArrow,
  isPlayer,
  MOVEMENT_KINDS,
  type Arrow,
  type ArrowKind,
  type Entity,
  type ThrowType,
  type Weergave,
} from './schema'

/**
 * Length of a freshly drawn arrow, in metres.
 *
 * Long enough that the point sits clear of the token and is easy to grab, and
 * short enough that it does not shoot across the field before you aim it. A
 * real cut is ten to twenty metres, so this is also a plausible starting shape.
 */
export const NIEUWE_ARROW_LENGTE_M = 12

/**
 * A throw endpoint within this distance of a receiver locks onto him.
 *
 * This is the floor, not the whole story: the editor widens it so the target
 * stays roughly a fingertip wide however far you have zoomed out. A throw that
 * silently fails to arrive because you were two metres off is the single most
 * confusing thing this editor can do.
 */
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

/**
 * Who a fresh throw should be aimed at.
 *
 * A throw goes to a person, and almost always to somebody who is cutting: his
 * arrival point, not where he stands now. Guessing that here means the common
 * case works with no dragging at all, and a wrong guess costs one drag, which is
 * what the old behaviour cost every single time.
 */
export function kiesOntvanger(
  entities: readonly Entity[],
  ownerId: string,
  weergave: Weergave,
): { id: string; pos: Point } | null {
  const werper = entities.find((e) => e.id === ownerId)
  if (!werper || !isPlayer(werper)) return null

  const richting = aanvalsRichting(weergave)
  const bewegingen = entities
    .filter(isArrow)
    .filter((a) => (MOVEMENT_KINDS as readonly string[]).includes(a.kind))

  const kandidaten = entities
    .filter(isPlayer)
    .filter((p) => p.id !== ownerId && p.side === werper.side)
    .map((p) => {
      const beweging = bewegingen.find((a) => a.ownerId === p.id)
      const doel = beweging ? arrowEnd(beweging) : p.pos
      const heen = (doel.x - werper.pos.x) * richting.x + (doel.y - werper.pos.y) * richting.y
      return { id: p.id, pos: doel, cut: Boolean(beweging), heen }
    })
    // Nobody throws backwards to open the offence up; a dump is the exception
    // and a trainer drags the tip for it.
    .filter((k) => k.heen > 0)

  if (kandidaten.length === 0) return null

  // A cutter beats a stander, and among equals the one furthest downfield.
  kandidaten.sort((a, b) => (a.cut === b.cut ? b.heen - a.heen : a.cut ? -1 : 1))
  const beste = kandidaten[0]!
  return { id: beste.id, pos: { ...beste.pos } }
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
  const ontvanger =
    options.kind === 'throw'
      ? kiesOntvanger(options.entities, options.ownerId, options.weergave)
      : null

  const eind =
    ontvanger?.pos ??
    klem({
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
      targetId: ontvanger?.id,
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
 *
 * A receiver counts twice: where he stands now, and where his cut takes him.
 * In ultimate you throw to the second one far more often than to the first, and
 * without it a throw to a cutter is simply not expressible.
 */
export function snapThrowEnd(
  pos: Point,
  entities: readonly Entity[],
  ownerId: string,
  snapM: number = THROW_SNAP_M,
): { pos: Point; targetId?: string } {
  type Kandidaat = { pos: Point; id: string; afstand: number }
  let beste: Kandidaat | null = null
  const bereik = Math.max(snapM, THROW_SNAP_M)

  const overweeg = (kandidaat: Point, id: string) => {
    const afstand = Math.hypot(kandidaat.x - pos.x, kandidaat.y - pos.y)
    if (afstand > bereik) return
    if (!beste || afstand < beste.afstand) beste = { pos: { ...kandidaat }, id, afstand }
  }

  const bewegingen = entities
    .filter(isArrow)
    .filter((a) => (MOVEMENT_KINDS as readonly string[]).includes(a.kind))

  for (const entity of entities) {
    if (!isPlayer(entity) || entity.id === ownerId) continue
    overweeg(entity.pos, entity.id)
    const beweging = bewegingen.find((a) => a.ownerId === entity.id)
    if (beweging) overweeg(arrowEnd(beweging), entity.id)
  }

  // The assignment happens inside a closure, which control-flow analysis does
  // not follow, so the narrowed type has to be restated here.
  const gevonden = beste as Kandidaat | null
  if (!gevonden) return { pos }
  return { pos: gevonden.pos, targetId: gevonden.id }
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
