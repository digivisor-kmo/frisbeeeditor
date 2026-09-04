import { FIELD_M } from '@/lib/field/geometry'
import { nextZ } from './entities'
import { ROLE_ABBREV } from './roles'
import type { Cone, Entity, FrameContent, Player, PlayerRole, Weergave } from './schema'

export type Opstelling = 'vertical-stack' | 'horizontal-stack' | 'leeg'

interface Spot {
  role: PlayerRole
  /** Distance from the attacking goal line, in metres. */
  vanGoalLine: number
  /** Across the field, in metres from the sideline at y = 0. */
  y: number
  disc?: boolean
}

const MIDDEN = FIELD_M.width / 2

/**
 * A vertical stack: three handlers behind the disc, four cutters strung out on
 * the centre axis towards the endzone.
 */
const VERTICAL_STACK: Spot[] = [
  { role: 'handler', vanGoalLine: 52, y: MIDDEN, disc: true },
  { role: 'handler', vanGoalLine: 55, y: MIDDEN - 5.5 },
  { role: 'handler', vanGoalLine: 55, y: MIDDEN + 5.5 },
  { role: 'cutter', vanGoalLine: 36, y: MIDDEN },
  { role: 'cutter', vanGoalLine: 31, y: MIDDEN },
  { role: 'deep', vanGoalLine: 26, y: MIDDEN },
  { role: 'wing', vanGoalLine: 21, y: MIDDEN },
]

/** A horizontal stack: three handlers, four cutters spread across the width. */
const HORIZONTAL_STACK: Spot[] = [
  { role: 'handler', vanGoalLine: 52, y: MIDDEN, disc: true },
  { role: 'handler', vanGoalLine: 55, y: MIDDEN - 6 },
  { role: 'handler', vanGoalLine: 55, y: MIDDEN + 6 },
  { role: 'cutter', vanGoalLine: 34, y: MIDDEN - 13 },
  { role: 'cutter', vanGoalLine: 34, y: MIDDEN - 4.5 },
  { role: 'cutter', vanGoalLine: 34, y: MIDDEN + 4.5 },
  { role: 'deep', vanGoalLine: 34, y: MIDDEN + 13 },
]

/**
 * The half-field view only shows one endzone plus 32 metres, so the same shape
 * has to sit closer together. These are the same seven roles, compressed.
 */
const HALF_SCALE = 0.58

const DEFENSE_ROLES_BY_INDEX: PlayerRole[] = [
  'mark',
  'mid',
  'mid',
  'mid',
  'mid',
  'short-deep',
  'deep-deep',
]

/**
 * How far the defender stands in front of their mark, towards the endzone.
 * Has to exceed a token diameter, otherwise the two tokens cover each other and
 * you cannot read either label.
 */
const MARK_GAP_M = 3.2

interface Layout {
  /** Position of the attacking goal line along the length axis. */
  goalLine: number
  /** +1 or -1: the direction in which the offence is moving. */
  richting: 1 | -1
  schaal: number
}

function layoutFor(weergave: Weergave): Layout {
  if (weergave === 'half') {
    // Endzone at the top of the portrait view; the offence attacks towards x = 0.
    return { goalLine: FIELD_M.endzoneDepth, richting: 1, schaal: HALF_SCALE }
  }
  // Endzone on the right; the offence attacks towards x = 100.
  return { goalLine: FIELD_M.length - FIELD_M.endzoneDepth, richting: -1, schaal: 1 }
}

function spotToX(spot: Spot, layout: Layout): number {
  return layout.goalLine + layout.richting * spot.vanGoalLine * layout.schaal
}

export function buildPreset(
  opstelling: Opstelling,
  weergave: Weergave,
  makeId: () => string,
): FrameContent {
  if (opstelling === 'leeg') return { entities: [] }

  const spots = opstelling === 'vertical-stack' ? VERTICAL_STACK : HORIZONTAL_STACK
  const layout = layoutFor(weergave)
  const entities: Entity[] = []

  for (const spot of spots) {
    const player: Player = {
      id: makeId(),
      type: 'player',
      z: nextZ(entities),
      pos: { x: spotToX(spot, layout), y: spot.y },
      side: 'offense',
      role: spot.role,
      color: 'standaard',
      hasDisc: spot.disc ?? false,
    }
    entities.push(player)
  }

  spots.forEach((spot, index) => {
    const defender: Player = {
      id: makeId(),
      type: 'player',
      z: nextZ(entities),
      pos: {
        x: spotToX(spot, layout) - layout.richting * MARK_GAP_M,
        y: spot.y,
      },
      side: 'defense',
      role: DEFENSE_ROLES_BY_INDEX[index]!,
      color: 'standaard',
      hasDisc: false,
    }
    entities.push(defender)
  })

  const coneX = spotToX(spots[0]!, layout)
  for (const y of [0.5, FIELD_M.width - 0.5]) {
    const cone: Cone = {
      id: makeId(),
      type: 'cone',
      z: nextZ(entities),
      pos: { x: coneX, y },
      color: 'standaard',
    }
    entities.push(cone)
  }

  return { entities }
}

export const OPSTELLING_LABELS: Record<Opstelling, string> = {
  'vertical-stack': 'Vertical stack',
  'horizontal-stack': 'Horizontal stack',
  leeg: 'Leeg veld',
}

export { ROLE_ABBREV }
