import { arrowEnd, verplaatsArrow } from './arrows'
import { hasPosition } from './entities'
import {
  isArrow,
  isPlayer,
  MOVEMENT_KINDS,
  type Arrow,
  type Entity,
  type FrameContent,
  type Player,
} from './schema'
import type { Point } from '@/lib/field/geometry'

/**
 * How a change in one frame reaches the frames after it.
 *
 * The model has one rule: a change applies from the frame you made it in
 * onwards. Positions move as a translation rather than a recalculation, so an
 * adjustment you made by hand in a later frame keeps its relative place instead
 * of being thrown away.
 *
 * On top of that sits one invariant, without which the animation breaks: if a
 * player has a movement arrow in frame N, his position in frame N + 1 IS the
 * end of that arrow. They are the same thing seen from two sides.
 */

const isBeweging = (arrow: Arrow) =>
  (MOVEMENT_KINDS as readonly string[]).includes(arrow.kind)

export function bewegingsArrowVan(content: FrameContent, ownerId: string): Arrow | undefined {
  return content.entities.filter(isArrow).find((a) => a.ownerId === ownerId && isBeweging(a))
}

/** Identity, as opposed to state: the same player in every frame. */
export interface Identiteit {
  side?: Player['side']
  role?: Player['role']
  label?: Player['label']
  color?: Player['color']
}

const nulDelta = (delta: Point) => delta.x === 0 && delta.y === 0

/**
 * Moves one entity in this frame and every frame after it, together with the
 * arrows that belong to it.
 */
export function verplaatsVanaf(
  frames: FrameContent[],
  vanafIndex: number,
  entityId: string,
  delta: Point,
): number {
  if (nulDelta(delta)) return 0
  let geraakt = 0

  for (let i = vanafIndex; i < frames.length; i++) {
    const content = frames[i]
    if (!content) continue

    const entity = content.entities.find((e) => e.id === entityId)
    if (!entity) continue

    if (hasPosition(entity)) {
      entity.pos = { x: entity.pos.x + delta.x, y: entity.pos.y + delta.y }
    } else if (isArrow(entity)) {
      verplaatsArrow(entity, delta)
    }

    // Arrows travel with their player: the shape you drew stays the shape.
    for (const other of content.entities) {
      if (isArrow(other) && other.ownerId === entityId) verplaatsArrow(other, delta)
    }

    if (i > vanafIndex) geraakt++
  }

  return geraakt
}

/**
 * Keeps the invariant alive when a player is dragged in frame N: the arrow that
 * put him there, back in frame N - 1, has to end where he now stands.
 */
export function synchroniseerArrowMetVorigFrame(
  frames: FrameContent[],
  index: number,
  entityId: string,
  delta: Point,
): void {
  if (index <= 0 || nulDelta(delta)) return
  const vorige = frames[index - 1]
  if (!vorige) return

  const arrow = bewegingsArrowVan(vorige, entityId)
  if (!arrow) return

  const laatste = arrow.path.points[arrow.path.points.length - 1]
  if (!laatste) return
  laatste.x += delta.x
  laatste.y += delta.y
}

/**
 * How close a throw endpoint has to sit to the point it was aimed at before we
 * treat the two as the same point, in metres.
 */
const AANGEHECHT_M = 0.05

/**
 * A throw aimed at somebody follows him. Move a receiver, or the end of the cut
 * he was throwing to, and the throw that was aimed there keeps pointing at him
 * instead of at the empty grass he left behind.
 */
export function volgWorpenNaar(
  content: FrameContent,
  spelerId: string,
  ankers: readonly Point[],
  delta: Point,
): void {
  if (nulDelta(delta) || ankers.length === 0) return

  for (const entity of content.entities) {
    if (!isArrow(entity) || entity.kind !== 'throw') continue
    if (entity.targetId !== spelerId) continue

    const eind = entity.path.points[entity.path.points.length - 1]
    if (!eind) continue
    const raakt = ankers.some(
      (anker) => Math.hypot(eind.x - anker.x, eind.y - anker.y) <= AANGEHECHT_M,
    )
    if (!raakt) continue

    eind.x += delta.x
    eind.y += delta.y
  }
}

/**
 * The two points a throw can be aimed at when it is aimed at somebody: where he
 * stands, and where his cut takes him.
 */
export function worpAnkers(content: FrameContent, spelerId: string): Point[] {
  const ankers: Point[] = []
  const entity = content.entities.find((e) => e.id === spelerId)
  if (entity && hasPosition(entity)) ankers.push({ ...entity.pos })
  const beweging = bewegingsArrowVan(content, spelerId)
  if (beweging) ankers.push({ ...arrowEnd(beweging) })
  return ankers
}

/** The move that a movement arrow describes: from its owner to its end. */
export function arrowVerplaatsing(content: FrameContent, arrow: Arrow): Point | null {
  if (!isBeweging(arrow)) return null
  const owner = content.entities.find((e) => e.id === arrow.ownerId)
  if (!owner || !hasPosition(owner)) return null
  const eind = arrowEnd(arrow)
  return { x: eind.x - owner.pos.x, y: eind.y - owner.pos.y }
}

/** A new entity exists from this frame on; it does not appear out of nowhere later. */
export function voegToeVanaf(frames: FrameContent[], vanafIndex: number, entity: Entity): number {
  let geraakt = 0
  for (let i = vanafIndex; i < frames.length; i++) {
    const content = frames[i]
    if (!content) continue
    if (content.entities.some((e) => e.id === entity.id)) continue
    content.entities.push(JSON.parse(JSON.stringify(entity)) as Entity)
    if (i > vanafIndex) geraakt++
  }
  return geraakt
}

/** Removing somebody removes him from here on; earlier frames keep him. */
export function verwijderVanaf(
  frames: FrameContent[],
  vanafIndex: number,
  ids: ReadonlySet<string>,
): number {
  let geraakt = 0
  for (let i = vanafIndex; i < frames.length; i++) {
    const content = frames[i]
    if (!content) continue
    const voor = content.entities.length
    content.entities = content.entities.filter(
      (e) => !ids.has(e.id) && !(isArrow(e) && ids.has(e.ownerId)),
    )
    if (i > vanafIndex && content.entities.length !== voor) geraakt++
  }
  return geraakt
}

/** Identity belongs to the player, not to a frame, so it lands in all of them. */
export function zetIdentiteit(
  frames: FrameContent[],
  entityId: string,
  patch: Identiteit,
): void {
  for (const content of frames) {
    const entity = content.entities.find((e) => e.id === entityId)
    if (!entity) continue
    if (isPlayer(entity)) {
      if (patch.side !== undefined) entity.side = patch.side
      if (patch.role !== undefined) entity.role = patch.role
      if (patch.color !== undefined) entity.color = patch.color
      if ('label' in patch) entity.label = patch.label
    } else if (entity.type === 'cone' && patch.color !== undefined) {
      entity.color = patch.color
    }
  }
}

/**
 * Walks the disc forward from a frame: whoever holds it keeps it until a throw
 * with a receiver hands it over.
 */
export function herberekenSchijfVanaf(frames: FrameContent[], vanafIndex: number): void {
  const start = frames[vanafIndex]
  if (!start) return

  let drager = start.entities.filter(isPlayer).find((p) => p.hasDisc)?.id ?? null

  for (let i = vanafIndex; i < frames.length - 1; i++) {
    const content = frames[i]
    const volgende = frames[i + 1]
    if (!content || !volgende) continue

    const worp = content.entities
      .filter(isArrow)
      .find((a) => a.kind === 'throw' && a.targetId && a.ownerId === drager)
    if (worp?.targetId) drager = worp.targetId

    for (const entity of volgende.entities) {
      if (isPlayer(entity)) entity.hasDisc = entity.id === drager
    }
  }
}
