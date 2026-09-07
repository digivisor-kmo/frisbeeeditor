import { nextRole } from './roles'
import {
  isPlayer,
  type Cone,
  type Entity,
  type FrameContent,
  type Player,
  type Point,
  type Side,
  type TextBlock,
  type Tokenstijl,
} from './schema'
import { ROLE_ABBREV } from './roles'

/** Ultimate is seven against seven. Anything else is a mistake worth showing. */
export const TEAM_SIZE = 7

export function occupancy(entities: readonly Entity[]): { offense: number; defense: number } {
  let offense = 0
  let defense = 0
  for (const entity of entities) {
    if (!isPlayer(entity)) continue
    if (entity.side === 'offense') offense++
    else defense++
  }
  return { offense, defense }
}

export function nextZ(entities: readonly Entity[]): number {
  return entities.reduce((max, e) => Math.max(max, e.z), 0) + 1
}

export function createPlayer(options: {
  id: string
  pos: Point
  side: Side
  entities: readonly Entity[]
}): Player {
  const counts = occupancy(options.entities)
  const placed = options.side === 'offense' ? counts.offense : counts.defense
  return {
    id: options.id,
    type: 'player',
    z: nextZ(options.entities),
    pos: options.pos,
    side: options.side,
    role: nextRole(options.side, placed),
    color: 'standaard',
    hasDisc: false,
  }
}

export function createCone(options: { id: string; pos: Point; entities: readonly Entity[] }): Cone {
  return {
    id: options.id,
    type: 'cone',
    z: nextZ(options.entities),
    pos: options.pos,
    color: 'standaard',
  }
}

/** What the token shows, given the diagram-wide token style. */
export function tokenText(player: Player, stijl: Tokenstijl): string {
  if (stijl === 'blanco') return ''
  if (stijl === 'xo') return player.side === 'offense' ? 'O' : 'X'
  return player.label ?? ROLE_ABBREV[player.role]
}

/**
 * Gives the disc to one player and takes it away from whoever had it.
 * Mutates an immer draft.
 */
export function giveDisc(content: FrameContent, playerId: string): void {
  for (const entity of content.entities) {
    if (isPlayer(entity)) entity.hasDisc = entity.id === playerId
  }
}

export function findEntity(content: FrameContent, id: string): Entity | undefined {
  return content.entities.find((e) => e.id === id)
}

/** Entities that carry a single position and can simply be dragged. */
export function hasPosition(entity: Entity): entity is Player | Cone | TextBlock {
  return entity.type === 'player' || entity.type === 'cone' || entity.type === 'text'
}

/**
 * Shifts whatever this entity is by a delta.
 *
 * A zone has no position of its own, only two corners, and both of them have to
 * move by the same amount or dragging it would reshape it. Keeping that in one
 * place means every caller that moves something moves all of it.
 */
export function beweeg(entity: Entity, delta: Point): void {
  if (hasPosition(entity)) {
    entity.pos = { x: entity.pos.x + delta.x, y: entity.pos.y + delta.y }
    return
  }
  if (entity.type === 'annotation') {
    entity.points = entity.points.map((p) => ({ x: p.x + delta.x, y: p.y + delta.y }))
    return
  }
  if (entity.type === 'coneLine') {
    entity.path.points = entity.path.points.map((p) => ({ x: p.x + delta.x, y: p.y + delta.y }))
  }
}

/**
 * The spot a menu should hang above, and the point a drag measures from.
 * A zone answers with its middle; there is nothing else sensible to point at.
 */
export function ankerVan(entity: Entity): Point | null {
  if (hasPosition(entity)) return entity.pos
  if (entity.type === 'annotation') {
    const a = entity.points[0]
    const b = entity.points[entity.points.length - 1]
    if (!a || !b) return null
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }
  return null
}
