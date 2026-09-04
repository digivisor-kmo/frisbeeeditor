import { arrowEnd, MAX_BOCHTEN } from './arrows'
import { isArrow, isPlayer, MOVEMENT_KINDS, type Arrow, type FrameContent } from './schema'

/** A diagram holds one to ten frames. */
export const MAX_FRAMES = 10

const isBeweging = (arrow: Arrow) =>
  (MOVEMENT_KINDS as readonly string[]).includes(arrow.kind)

/** The arrows in this frame that actually move somebody. */
export function bewegingsArrows(content: FrameContent): Arrow[] {
  return content.entities.filter(isArrow).filter(isBeweging)
}

/**
 * Whether a next frame can be built from this one.
 *
 * Without a movement arrow there is nothing to continue, and the next frame
 * would be an identical copy. The interface says why rather than only greying
 * out the button, otherwise you go looking for what you did wrong.
 */
export function kanFrameToevoegen(content: FrameContent, aantalFrames: number): boolean {
  return aantalFrames < MAX_FRAMES && bewegingsArrows(content).length > 0
}

/**
 * The next frame: a copy of this one in which every player with a movement
 * arrow stands at the end of that arrow, and the arrow itself is gone.
 *
 * Entities keep their id across frames. That is how the animation knows what
 * moved where; giving copies new ids would turn every movement into one entity
 * disappearing and another appearing.
 */
export function volgendFrame(content: FrameContent): FrameContent {
  const verbruikt = new Set<string>()
  const nieuwePosities = new Map<string, { x: number; y: number }>()
  let schijfNaar: string | null = null
  let schijfVan: string | null = null

  for (const entity of content.entities) {
    if (!isArrow(entity)) continue

    if (isBeweging(entity)) {
      // One player, one move: a second arrow on the same player is left alone
      // rather than silently ignored.
      if (nieuwePosities.has(entity.ownerId)) continue
      nieuwePosities.set(entity.ownerId, { ...arrowEnd(entity) })
      verbruikt.add(entity.id)
      continue
    }

    // A throw that has a receiver hands the disc over and is done. A throw into
    // open space is left standing: it has not arrived anywhere yet.
    if (entity.kind === 'throw' && entity.targetId) {
      schijfNaar = entity.targetId
      schijfVan = entity.ownerId
      verbruikt.add(entity.id)
    }
  }

  const entities = content.entities
    .filter((entity) => !verbruikt.has(entity.id))
    .map((entity) => {
      if (isPlayer(entity)) {
        const pos = nieuwePosities.get(entity.id)
        const speler = {
          ...entity,
          pos: pos ? { ...pos } : { ...entity.pos },
        }
        if (schijfNaar) {
          if (entity.id === schijfNaar) speler.hasDisc = true
          else if (entity.id === schijfVan) speler.hasDisc = false
        }
        return speler
      }

      if (isArrow(entity)) {
        return { ...entity, path: { points: entity.path.points.map((p) => ({ ...p })) } }
      }

      return { ...entity }
    })

  // Arrows whose owner moved come along, so they still start at their player.
  for (const entity of entities) {
    if (!isArrow(entity)) continue
    const verplaatsing = nieuwePosities.get(entity.ownerId)
    if (!verplaatsing) continue
    const oud = content.entities.find((e) => e.id === entity.ownerId)
    if (!oud || !isPlayer(oud)) continue
    const delta = { x: verplaatsing.x - oud.pos.x, y: verplaatsing.y - oud.pos.y }
    for (const punt of entity.path.points) {
      punt.x += delta.x
      punt.y += delta.y
    }
  }

  return { entities }
}

export { MAX_BOCHTEN }
