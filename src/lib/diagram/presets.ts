import { FIELD_M } from '@/lib/field/geometry'
import { nextZ } from './entities'
import type { Cone, Entity, FrameContent, Player, PlayerRole, Weergave } from './schema'

export type Opstelling = 'vertical-stack' | 'horizontal-stack' | 'leeg'

interface Spot {
  role: PlayerRole
  /** Distance from the attacking goal line, in metres. */
  vanGoalLine: number
  /** Across the field, in metres from the sideline at y = 0. */
  y: number
  disc?: boolean
  /**
   * Where this player's defender stands, relative to them.
   * `langs` counts towards the endzone the offence is attacking, `opzij` across
   * the field. In a vertical stack the defenders stand beside their man rather
   * than in front of him: in front would put every defender on top of the next
   * player in the stack, and then neither label is readable.
   */
  dLangs?: number
  dOpzij?: number
}

const MIDDEN = FIELD_M.width / 2

/** Default: the defender stands between his man and the endzone. */
const DEFAULT_D_LANGS = 3.2

/** Stack defenders: just beside the stack, all on the same side. */
const STACK_D = { dLangs: 0.8, dOpzij: -3.4 }

const VERTICAL_STACK: Record<'volledig' | 'half', Spot[]> = {
  volledig: [
    { role: 'handler', vanGoalLine: 52, y: MIDDEN, disc: true },
    { role: 'handler', vanGoalLine: 55, y: MIDDEN - 5.5 },
    { role: 'handler', vanGoalLine: 55, y: MIDDEN + 5.5 },
    { role: 'cutter', vanGoalLine: 36, y: MIDDEN, ...STACK_D },
    { role: 'cutter', vanGoalLine: 31, y: MIDDEN, ...STACK_D },
    { role: 'deep', vanGoalLine: 26, y: MIDDEN, ...STACK_D },
    { role: 'wing', vanGoalLine: 21, y: MIDDEN, ...STACK_D },
  ],
  half: [
    { role: 'handler', vanGoalLine: 26, y: MIDDEN, disc: true },
    { role: 'handler', vanGoalLine: 29, y: MIDDEN - 5.5 },
    { role: 'handler', vanGoalLine: 29, y: MIDDEN + 5.5 },
    { role: 'cutter', vanGoalLine: 16, y: MIDDEN, ...STACK_D },
    { role: 'cutter', vanGoalLine: 11, y: MIDDEN, ...STACK_D },
    { role: 'deep', vanGoalLine: 6, y: MIDDEN, ...STACK_D },
    { role: 'wing', vanGoalLine: 2, y: MIDDEN, ...STACK_D },
  ],
}

const HORIZONTAL_STACK: Record<'volledig' | 'half', Spot[]> = {
  volledig: [
    { role: 'handler', vanGoalLine: 52, y: MIDDEN, disc: true },
    { role: 'handler', vanGoalLine: 55, y: MIDDEN - 6 },
    { role: 'handler', vanGoalLine: 55, y: MIDDEN + 6 },
    { role: 'cutter', vanGoalLine: 34, y: MIDDEN - 13 },
    { role: 'cutter', vanGoalLine: 34, y: MIDDEN - 4.5 },
    { role: 'cutter', vanGoalLine: 34, y: MIDDEN + 4.5 },
    { role: 'deep', vanGoalLine: 34, y: MIDDEN + 13 },
  ],
  half: [
    { role: 'handler', vanGoalLine: 26, y: MIDDEN, disc: true },
    { role: 'handler', vanGoalLine: 29, y: MIDDEN - 6 },
    { role: 'handler', vanGoalLine: 29, y: MIDDEN + 6 },
    { role: 'cutter', vanGoalLine: 13, y: MIDDEN - 13 },
    { role: 'cutter', vanGoalLine: 13, y: MIDDEN - 4.5 },
    { role: 'cutter', vanGoalLine: 13, y: MIDDEN + 4.5 },
    { role: 'deep', vanGoalLine: 13, y: MIDDEN + 13 },
  ],
}

const DEFENSE_ROLES_BY_INDEX: PlayerRole[] = [
  'mark',
  'mid',
  'mid',
  'mid',
  'mid',
  'short-deep',
  'deep-deep',
]

interface Layout {
  /** Position of the attacking goal line along the length axis. */
  goalLine: number
  /** The direction from the goal line back into the field: positions grow this way. */
  richting: 1 | -1
  variant: 'volledig' | 'half'
}

function layoutFor(weergave: Weergave): Layout {
  if (weergave === 'half') {
    // Endzone at the top of the portrait view; the offence attacks towards x = 0.
    return { goalLine: FIELD_M.endzoneDepth, richting: 1, variant: 'half' }
  }
  // Endzone on the right; the offence attacks towards x = 100.
  return { goalLine: FIELD_M.length - FIELD_M.endzoneDepth, richting: -1, variant: 'volledig' }
}

const spotX = (spot: Spot, layout: Layout) =>
  layout.goalLine + layout.richting * spot.vanGoalLine

export function buildPreset(
  opstelling: Opstelling,
  weergave: Weergave,
  makeId: () => string,
): FrameContent {
  if (opstelling === 'leeg') return { entities: [] }

  const layout = layoutFor(weergave)
  const table = opstelling === 'vertical-stack' ? VERTICAL_STACK : HORIZONTAL_STACK
  const spots = table[layout.variant]
  const entities: Entity[] = []

  for (const spot of spots) {
    const player: Player = {
      id: makeId(),
      type: 'player',
      z: nextZ(entities),
      pos: { x: spotX(spot, layout), y: spot.y },
      side: 'offense',
      role: spot.role,
      color: 'standaard',
      hasDisc: spot.disc ?? false,
    }
    entities.push(player)
  }

  spots.forEach((spot, index) => {
    const langs = spot.dLangs ?? DEFAULT_D_LANGS
    const defender: Player = {
      id: makeId(),
      type: 'player',
      z: nextZ(entities),
      pos: {
        x: spotX(spot, layout) - layout.richting * langs,
        y: spot.y + (spot.dOpzij ?? 0),
      },
      side: 'defense',
      role: DEFENSE_ROLES_BY_INDEX[index]!,
      color: 'standaard',
      hasDisc: false,
    }
    entities.push(defender)
  })

  const coneX = spotX(spots[0]!, layout)
  for (const y of [0.6, FIELD_M.width - 0.6]) {
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
