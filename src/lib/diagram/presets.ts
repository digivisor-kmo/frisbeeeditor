import { FIELD_M } from '@/lib/field/geometry'
import { nextZ } from './entities'
import type { Cone, Entity, FrameContent, Player, PlayerRole, Weergave } from './schema'

export type Opstelling =
  | 'vertical-stack'
  | 'horizontal-stack'
  | 'side-stack'
  | 'endzone'
  | 'zone'
  | 'pull-play'
  | 'leeg'

/** The order they appear in, from the most everyday to the most specific. */
export const OPSTELLINGEN: Opstelling[] = [
  'vertical-stack',
  'horizontal-stack',
  'side-stack',
  'endzone',
  'zone',
  'pull-play',
  'leeg',
]

export const OPSTELLING_LABELS: Record<Opstelling, string> = {
  'vertical-stack': 'Vertical stack',
  'horizontal-stack': 'Horizontal stack',
  'side-stack': 'Side stack',
  endzone: 'Endzone-set',
  zone: 'Zoneverdediging',
  'pull-play': 'Pull play',
  leeg: 'Leeg veld',
}

/**
 * The category a starting formation already answers.
 *
 * Choosing a vertical stack IS choosing the category; asking for it again two
 * screens later is asking somebody to repeat themselves. An empty field says
 * nothing yet, so it leaves the question open.
 */
export const CATEGORIE_VAN_OPSTELLING: Record<Opstelling, string | null> = {
  'vertical-stack': 'vertical stack',
  'horizontal-stack': 'horizontal stack',
  'side-stack': 'side stack',
  endzone: 'endzone-set',
  zone: 'zoneverdediging',
  'pull-play': 'pull play',
  leeg: null,
}

interface Spot {
  role: PlayerRole
  /**
   * Distance from the goal line the offence is attacking, in metres. Positive
   * counts back into the field; negative is inside that endzone.
   */
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

/** A defender who belongs to a shape rather than to a man. */
interface Zonepost {
  role: PlayerRole
  vanGoalLine: number
  y: number
}

interface Opzet {
  aanval: Spot[]
  /** Set for a zone: seven defenders in a shape instead of one per attacker. */
  verdediging?: Zonepost[]
}

const MIDDEN = FIELD_M.width / 2

/** Default: the defender stands between his man and the endzone. */
const DEFAULT_D_LANGS = 3.2

/** Stack defenders: just beside the stack, all on the same side. */
const STACK_D = { dLangs: 0.8, dOpzij: -3.4 }

type Variant = 'volledig' | 'half'

/**
 * Every formation, in both the sizes it makes sense in.
 *
 * A half field shows one endzone plus about 32 metres, so anything that lives
 * further back than that has no half version — a cup around a disc at 52 metres
 * would stand outside the drawing. Those formations are simply not offered when
 * you pick a half field, which is better than offering them and drawing them
 * off the edge.
 */
const OPZETTEN: Record<Exclude<Opstelling, 'leeg'>, Partial<Record<Variant, Opzet>>> = {
  'vertical-stack': {
    volledig: {
      aanval: [
        { role: 'handler', vanGoalLine: 52, y: MIDDEN, disc: true },
        { role: 'handler', vanGoalLine: 55, y: MIDDEN - 5.5 },
        { role: 'handler', vanGoalLine: 55, y: MIDDEN + 5.5 },
        { role: 'cutter', vanGoalLine: 36, y: MIDDEN, ...STACK_D },
        { role: 'cutter', vanGoalLine: 31, y: MIDDEN, ...STACK_D },
        { role: 'deep', vanGoalLine: 26, y: MIDDEN, ...STACK_D },
        { role: 'wing', vanGoalLine: 21, y: MIDDEN, ...STACK_D },
      ],
    },
    half: {
      aanval: [
        { role: 'handler', vanGoalLine: 26, y: MIDDEN, disc: true },
        { role: 'handler', vanGoalLine: 29, y: MIDDEN - 5.5 },
        { role: 'handler', vanGoalLine: 29, y: MIDDEN + 5.5 },
        { role: 'cutter', vanGoalLine: 16, y: MIDDEN, ...STACK_D },
        { role: 'cutter', vanGoalLine: 11, y: MIDDEN, ...STACK_D },
        { role: 'deep', vanGoalLine: 6, y: MIDDEN, ...STACK_D },
        { role: 'wing', vanGoalLine: 2, y: MIDDEN, ...STACK_D },
      ],
    },
  },

  'horizontal-stack': {
    volledig: {
      aanval: [
        { role: 'handler', vanGoalLine: 52, y: MIDDEN, disc: true },
        { role: 'handler', vanGoalLine: 55, y: MIDDEN - 6 },
        { role: 'handler', vanGoalLine: 55, y: MIDDEN + 6 },
        { role: 'cutter', vanGoalLine: 34, y: MIDDEN - 13 },
        { role: 'cutter', vanGoalLine: 34, y: MIDDEN - 4.5 },
        { role: 'cutter', vanGoalLine: 34, y: MIDDEN + 4.5 },
        { role: 'deep', vanGoalLine: 34, y: MIDDEN + 13 },
      ],
    },
    half: {
      aanval: [
        { role: 'handler', vanGoalLine: 26, y: MIDDEN, disc: true },
        { role: 'handler', vanGoalLine: 29, y: MIDDEN - 6 },
        { role: 'handler', vanGoalLine: 29, y: MIDDEN + 6 },
        { role: 'cutter', vanGoalLine: 13, y: MIDDEN - 13 },
        { role: 'cutter', vanGoalLine: 13, y: MIDDEN - 4.5 },
        { role: 'cutter', vanGoalLine: 13, y: MIDDEN + 4.5 },
        { role: 'deep', vanGoalLine: 13, y: MIDDEN + 13 },
      ],
    },
  },

  /*
   * The stack stands along one sideline and leaves the rest of the field empty
   * for one cutter. That empty half IS the formation, so the isolated cutter
   * starts in it rather than in the stack.
   */
  'side-stack': {
    volledig: {
      aanval: [
        { role: 'handler', vanGoalLine: 52, y: MIDDEN - 2, disc: true },
        { role: 'handler', vanGoalLine: 55, y: MIDDEN - 8 },
        { role: 'handler', vanGoalLine: 55, y: MIDDEN + 4 },
        { role: 'cutter', vanGoalLine: 40, y: MIDDEN - 9 },
        { role: 'cutter', vanGoalLine: 38, y: MIDDEN + 12, ...STACK_D },
        { role: 'cutter', vanGoalLine: 33, y: MIDDEN + 12, ...STACK_D },
        { role: 'deep', vanGoalLine: 28, y: MIDDEN + 12, ...STACK_D },
      ],
    },
    half: {
      aanval: [
        { role: 'handler', vanGoalLine: 26, y: MIDDEN - 2, disc: true },
        { role: 'handler', vanGoalLine: 29, y: MIDDEN - 8 },
        { role: 'handler', vanGoalLine: 29, y: MIDDEN + 4 },
        { role: 'cutter', vanGoalLine: 16, y: MIDDEN - 9 },
        { role: 'cutter', vanGoalLine: 14, y: MIDDEN + 12, ...STACK_D },
        { role: 'cutter', vanGoalLine: 9, y: MIDDEN + 12, ...STACK_D },
        { role: 'deep', vanGoalLine: 4, y: MIDDEN + 12, ...STACK_D },
      ],
    },
  },

  /*
   * Scoring. The disc sits just outside the endzone and the stack stands inside
   * it, so every cut comes back towards the thrower.
   */
  endzone: {
    volledig: {
      aanval: [
        { role: 'handler', vanGoalLine: 4, y: MIDDEN - 6, disc: true },
        { role: 'handler', vanGoalLine: 7, y: MIDDEN + 1 },
        { role: 'handler', vanGoalLine: 6, y: MIDDEN + 9 },
        { role: 'cutter', vanGoalLine: -3, y: MIDDEN, ...STACK_D },
        { role: 'cutter', vanGoalLine: -7, y: MIDDEN, ...STACK_D },
        { role: 'cutter', vanGoalLine: -11, y: MIDDEN, ...STACK_D },
        { role: 'deep', vanGoalLine: -15, y: MIDDEN, ...STACK_D },
      ],
    },
    half: {
      aanval: [
        { role: 'handler', vanGoalLine: 4, y: MIDDEN - 6, disc: true },
        { role: 'handler', vanGoalLine: 7, y: MIDDEN + 1 },
        { role: 'handler', vanGoalLine: 6, y: MIDDEN + 9 },
        { role: 'cutter', vanGoalLine: -3, y: MIDDEN, ...STACK_D },
        { role: 'cutter', vanGoalLine: -7, y: MIDDEN, ...STACK_D },
        { role: 'cutter', vanGoalLine: -11, y: MIDDEN, ...STACK_D },
        { role: 'deep', vanGoalLine: -15, y: MIDDEN, ...STACK_D },
      ],
    },
  },

  /*
   * A cup of three around the disc, two wings, a short deep and a deep deep —
   * the 3-2-2. The offence stands the way you stand against it: three handlers,
   * two poppers in the holes, two wings wide.
   */
  zone: {
    volledig: {
      aanval: [
        { role: 'handler', vanGoalLine: 52, y: MIDDEN, disc: true },
        { role: 'handler', vanGoalLine: 56, y: MIDDEN - 7 },
        { role: 'handler', vanGoalLine: 56, y: MIDDEN + 7 },
        { role: 'popper', vanGoalLine: 45, y: MIDDEN - 4 },
        { role: 'popper', vanGoalLine: 45, y: MIDDEN + 4 },
        { role: 'wing', vanGoalLine: 37, y: MIDDEN - 14 },
        { role: 'wing', vanGoalLine: 37, y: MIDDEN + 14 },
      ],
      verdediging: [
        { role: 'mark', vanGoalLine: 50, y: MIDDEN },
        { role: 'cup', vanGoalLine: 47.5, y: MIDDEN - 5 },
        { role: 'cup', vanGoalLine: 47.5, y: MIDDEN + 5 },
        { role: 'mid', vanGoalLine: 41, y: MIDDEN - 12 },
        { role: 'mid', vanGoalLine: 41, y: MIDDEN + 12 },
        { role: 'short-deep', vanGoalLine: 41, y: MIDDEN },
        { role: 'deep-deep', vanGoalLine: 28, y: MIDDEN },
      ],
    },
  },

  /*
   * The pull is in the air: nobody holds the disc yet. Both lines stand on
   * their own goal line, which is the one thing every pull play starts from.
   */
  'pull-play': {
    volledig: {
      aanval: [
        { role: 'handler', vanGoalLine: 64, y: MIDDEN - 15 },
        { role: 'handler', vanGoalLine: 64, y: MIDDEN - 10 },
        { role: 'handler', vanGoalLine: 64, y: MIDDEN - 5 },
        { role: 'cutter', vanGoalLine: 64, y: MIDDEN },
        { role: 'cutter', vanGoalLine: 64, y: MIDDEN + 5 },
        { role: 'cutter', vanGoalLine: 64, y: MIDDEN + 10 },
        { role: 'deep', vanGoalLine: 64, y: MIDDEN + 15 },
      ],
      verdediging: [
        { role: 'mark', vanGoalLine: 0, y: MIDDEN - 15 },
        { role: 'mid', vanGoalLine: 0, y: MIDDEN - 10 },
        { role: 'mid', vanGoalLine: 0, y: MIDDEN - 5 },
        { role: 'mid', vanGoalLine: 0, y: MIDDEN },
        { role: 'mid', vanGoalLine: 0, y: MIDDEN + 5 },
        { role: 'short-deep', vanGoalLine: 0, y: MIDDEN + 10 },
        { role: 'deep-deep', vanGoalLine: 0, y: MIDDEN + 15 },
      ],
    },
  },
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
  variant: Variant
}

function layoutFor(weergave: Weergave): Layout {
  if (weergave === 'half') {
    // Endzone at the top of the portrait view; the offence attacks towards x = 0.
    return { goalLine: FIELD_M.endzoneDepth, richting: 1, variant: 'half' }
  }
  // Endzone on the right; the offence attacks towards x = 100.
  return { goalLine: FIELD_M.length - FIELD_M.endzoneDepth, richting: -1, variant: 'volledig' }
}

const spotX = (afstand: number, layout: Layout) => layout.goalLine + layout.richting * afstand

/** Whether this formation has a version that fits on this field. */
export function opstellingPast(opstelling: Opstelling, weergave: Weergave): boolean {
  if (opstelling === 'leeg') return true
  return OPZETTEN[opstelling][layoutFor(weergave).variant] !== undefined
}

export function opstellingenVoor(weergave: Weergave): Opstelling[] {
  return OPSTELLINGEN.filter((o) => opstellingPast(o, weergave))
}

function speler(
  makeId: () => string,
  entities: Entity[],
  pos: { x: number; y: number },
  side: Player['side'],
  role: PlayerRole,
  disc = false,
): Player {
  return {
    id: makeId(),
    type: 'player',
    z: nextZ(entities),
    pos,
    side,
    role,
    color: 'standaard',
    hasDisc: disc,
  }
}

export function buildPreset(
  opstelling: Opstelling,
  weergave: Weergave,
  makeId: () => string,
): FrameContent {
  if (opstelling === 'leeg') return { entities: [] }

  const layout = layoutFor(weergave)
  const opzet = OPZETTEN[opstelling][layout.variant]
  if (!opzet) return { entities: [] }

  const entities: Entity[] = []

  for (const spot of opzet.aanval) {
    entities.push(
      speler(
        makeId,
        entities,
        { x: spotX(spot.vanGoalLine, layout), y: spot.y },
        'offense',
        spot.role,
        spot.disc ?? false,
      ),
    )
  }

  if (opzet.verdediging) {
    for (const post of opzet.verdediging) {
      entities.push(
        speler(
          makeId,
          entities,
          { x: spotX(post.vanGoalLine, layout), y: post.y },
          'defense',
          post.role,
        ),
      )
    }
  } else {
    opzet.aanval.forEach((spot, index) => {
      const langs = spot.dLangs ?? DEFAULT_D_LANGS
      entities.push(
        speler(
          makeId,
          entities,
          {
            x: spotX(spot.vanGoalLine, layout) - layout.richting * langs,
            y: spot.y + (spot.dOpzij ?? 0),
          },
          'defense',
          DEFENSE_ROLES_BY_INDEX[index]!,
        ),
      )
    })
  }

  const coneX = spotX(opzet.aanval[0]!.vanGoalLine, layout)
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
