import { buildLengthTable, pointAtDistance } from './curve'
import { isArrow, isPlayer, MOVEMENT_KINDS, type Arrow, type FrameContent } from './schema'
import type { Point } from '@/lib/field/geometry'

/** Softens the start and the end of every movement. */
export function easeInOut(t: number): number {
  const g = Math.min(Math.max(t, 0), 1)
  return g < 0.5 ? 2 * g * g : 1 - (-2 * g + 2) ** 2 / 2
}

/** How far a juke swings out sideways, in metres, and how often. */
export const JUKE_AMPLITUDE_M = 0.5
export const JUKE_CYCLI = 3

/** The disc leaves at 30 percent of the frame and lands at 90. */
export const WORP_START = 0.3
export const WORP_AANKOMST = 0.9

/**
 * How the disc covers its flight.
 *
 * A player accelerates and slows down, so his movement is eased at both ends.
 * A disc does not: it leaves the hand at full speed and floats in a little. Ease
 * it in as well and the throw reads as being carried across rather than thrown.
 */
export function worpEase(t: number): number {
  const g = Math.min(Math.max(t, 0), 1)
  return 1 - (1 - g) ** 1.7
}

/** An entity that appears or disappears fades over this long. */
export const FADE_MS = 200

const beweegtMee = (arrow: Arrow) =>
  (MOVEMENT_KINDS as readonly string[]).includes(arrow.kind)

function bewegingVan(content: FrameContent, spelerId: string): Arrow | undefined {
  return content.entities
    .filter(isArrow)
    .find((arrow) => arrow.ownerId === spelerId && beweegtMee(arrow))
}

function positieIn(content: FrameContent, id: string): Point | null {
  const entity = content.entities.find((e) => e.id === id)
  if (!entity) return null
  if (entity.type === 'player' || entity.type === 'cone' || entity.type === 'text') {
    return entity.pos
  }
  return null
}

const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})

/**
 * Where an entity is, part way between two frames.
 *
 * A player with a cut follows the path he was given, measured along its arc
 * length rather than along the curve parameter: stepping in t alone makes a
 * player visibly speed up and slow down in the bends. A juke follows the same
 * path with a sine laid over it. Everybody else moves in a straight line.
 */
export function positieOpTijd(
  vorig: FrameContent,
  volgend: FrameContent,
  id: string,
  t: number,
): Point | null {
  const van = positieIn(vorig, id)
  const naar = positieIn(volgend, id)
  if (!van) return naar
  if (!naar) return van

  const eased = easeInOut(t)
  const arrow = bewegingVan(vorig, id)
  if (!arrow) return lerp(van, naar, eased)

  const table = buildLengthTable(arrow.path.points)
  if (table.total === 0) return lerp(van, naar, eased)

  const { point, tangent } = pointAtDistance(table, table.total * eased)
  if (arrow.kind !== 'juke') return point

  // Damped at both ends, so the player leaves and arrives on the line itself.
  const demping = Math.sin(Math.PI * t)
  const afwijking = Math.sin(2 * Math.PI * JUKE_CYCLI * t) * JUKE_AMPLITUDE_M * demping
  return { x: point.x - tangent.y * afwijking, y: point.y + tangent.x * afwijking }
}

/** Fades an entity in or out when it is not in both frames. */
export function dekkingOpTijd(
  vorig: FrameContent,
  volgend: FrameContent,
  id: string,
  t: number,
  duurMs: number,
): number {
  const inVorig = vorig.entities.some((e) => e.id === id)
  const inVolgend = volgend.entities.some((e) => e.id === id)
  if (inVorig && inVolgend) return 1

  const fade = Math.min(0.5, FADE_MS / Math.max(duurMs, 1))
  if (!inVorig) return Math.min(1, t / fade)
  return Math.min(1, (1 - t) / fade)
}

export interface SchijfOnderweg {
  point: Point
  /** The player the disc left, hidden while it is in the air. */
  vanId: string
}

/**
 * The throw that is actually in the air this frame: one that has a receiver and
 * leaves the hand that holds the disc. Anything else is a throw into open
 * space, which has not arrived anywhere and so never flies.
 */
function actieveWorp(vorig: FrameContent): Arrow | undefined {
  const drager = vorig.entities.filter(isPlayer).find((p) => p.hasDisc)?.id
  if (!drager) return undefined
  return vorig.entities
    .filter(isArrow)
    .find((arrow) => arrow.kind === 'throw' && arrow.targetId && arrow.ownerId === drager)
}

/**
 * The disc, while it is between two players. Returns null outside the flight,
 * so it is simply drawn on whoever holds it.
 *
 * Both ends of the flight are pinned to living people rather than to the curve
 * the trainer drew: a handler who throws and cuts still lets go with his hand,
 * and a cutter still catches it in his. The correction runs from nothing at the
 * release to the full offset at the catch, so the shape of the throw survives.
 */
export function schijfOpTijd(
  vorig: FrameContent,
  volgend: FrameContent,
  t: number,
): SchijfOnderweg | null {
  const worp = actieveWorp(vorig)
  if (!worp?.targetId) return null
  if (t < WORP_START || t > WORP_AANKOMST) return null

  const deel = (t - WORP_START) / (WORP_AANKOMST - WORP_START)
  const table = buildLengthTable(worp.path.points)
  if (table.total === 0) return null

  const eased = worpEase(deel)
  const punt = pointAtDistance(table, table.total * eased).point

  const start = worp.path.points[0]
  const eind = worp.path.points[worp.path.points.length - 1]
  const werper = positieOpTijd(vorig, volgend, worp.ownerId, t)
  const ontvanger = positieOpTijd(vorig, volgend, worp.targetId, t)

  const vanaf =
    werper && start ? { x: werper.x - start.x, y: werper.y - start.y } : { x: 0, y: 0 }
  const naar =
    ontvanger && eind ? { x: ontvanger.x - eind.x, y: ontvanger.y - eind.y } : { x: 0, y: 0 }

  return {
    point: {
      x: punt.x + vanaf.x * (1 - eased) + naar.x * eased,
      y: punt.y + vanaf.y * (1 - eased) + naar.y * eased,
    },
    vanId: worp.ownerId,
  }
}

/** Who already holds the disc at this point in time, if the throw has landed. */
export function schijfDragerOpTijd(vorig: FrameContent, t: number): string | null {
  const worp = actieveWorp(vorig)
  if (!worp?.targetId) return null
  return t >= WORP_AANKOMST ? worp.targetId : worp.ownerId
}

/** Total playing time: every frame lasts until the next one. */
export function totaleDuur(duren: readonly number[]): number {
  return duren.slice(0, -1).reduce((som, ms) => som + ms, 0)
}

/** Which frame we are in, and how far along, at a moment in the timeline. */
export function frameOpTijd(
  duren: readonly number[],
  tijdMs: number,
): { index: number; t: number } {
  if (duren.length <= 1) return { index: 0, t: 0 }

  let rest = Math.max(0, tijdMs)
  for (let i = 0; i < duren.length - 1; i++) {
    const duur = Math.max(duren[i] ?? 1, 1)
    if (rest < duur) return { index: i, t: rest / duur }
    rest -= duur
  }
  return { index: duren.length - 2, t: 1 }
}

export const isSpelerZichtbaar = (
  content: FrameContent,
  id: string,
  focus: 'offense' | 'defense' | 'beide',
): boolean => {
  if (focus === 'beide') return true
  const entity = content.entities.find((e) => e.id === id)
  if (!entity || !isPlayer(entity)) return true
  return entity.side === focus
}
