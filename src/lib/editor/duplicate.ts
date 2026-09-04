import { nextZ } from '@/lib/diagram/entities'
import type { Entity, Point } from '@/lib/diagram/schema'

/** How far a copy lands from its original, in metres. */
export const DUPLICEER_OFFSET_M: Point = { x: 2, y: 2 }

function verschuif(p: Point, offset: Point): Point {
  return { x: p.x + offset.x, y: p.y + offset.y }
}

/**
 * Copies the selected entities.
 *
 * Two rules keep the result a valid frame. A copy of the player holding the
 * disc does not also hold it, because only one player can. And a copied throw
 * keeps pointing at the original thrower rather than at the copy, because the
 * copy has no disc to throw.
 */
export function dupliceer(
  entities: readonly Entity[],
  ids: ReadonlySet<string>,
  makeId: () => string,
  offset: Point = DUPLICEER_OFFSET_M,
): { kopieen: Entity[]; nieuweIds: string[] } {
  const teKopieren = entities.filter((e) => ids.has(e.id))
  const idKaart = new Map<string, string>()
  for (const entity of teKopieren) idKaart.set(entity.id, makeId())

  const kopieen: Entity[] = []
  let z = nextZ(entities)

  for (const entity of teKopieren) {
    const nieuweId = idKaart.get(entity.id)!
    z += 1

    switch (entity.type) {
      case 'player':
        kopieen.push({ ...entity, id: nieuweId, z, pos: verschuif(entity.pos, offset), hasDisc: false })
        break
      case 'cone':
        kopieen.push({ ...entity, id: nieuweId, z, pos: verschuif(entity.pos, offset) })
        break
      case 'text':
        kopieen.push({ ...entity, id: nieuweId, z, pos: verschuif(entity.pos, offset) })
        break
      case 'arrow': {
        const eigenaarKopie = idKaart.get(entity.ownerId)
        kopieen.push({
          ...entity,
          id: nieuweId,
          z,
          // A throw stays with the thrower who actually has the disc.
          ownerId: entity.kind === 'throw' ? entity.ownerId : (eigenaarKopie ?? entity.ownerId),
          targetId: entity.targetId ? (idKaart.get(entity.targetId) ?? entity.targetId) : undefined,
          path: { points: entity.path.points.map((p) => verschuif(p, offset)) },
        })
        break
      }
      case 'coneLine':
        kopieen.push({
          ...entity,
          id: nieuweId,
          z,
          path: { points: entity.path.points.map((p) => verschuif(p, offset)) },
        })
        break
      case 'annotation':
        kopieen.push({
          ...entity,
          id: nieuweId,
          z,
          points: entity.points.map((p) => verschuif(p, offset)),
        })
        break
    }
  }

  return { kopieen, nieuweIds: kopieen.map((e) => e.id) }
}
