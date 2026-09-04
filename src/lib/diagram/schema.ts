import { z } from 'zod'

/**
 * The single source of truth for what a diagram contains.
 *
 * A frame's entities are stored as one jsonb blob in `frames.content` and are
 * validated with these schemas on every save. `SCHEMA_VERSION` is written
 * alongside so a future migration has something to branch on.
 */
export const SCHEMA_VERSION = 1

/* ------------------------------------------------------------------ shared */

export const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
})
export type Point = z.infer<typeof pointSchema>

/**
 * A path is a list of points that all lie ON the curve: start, zero or more
 * bend points, end. The Bezier control points are derived from these with
 * Catmull-Rom at render time and are never stored.
 */
export const pathSchema = z.object({
  points: z.array(pointSchema).min(2),
})
export type Path = z.infer<typeof pathSchema>

/**
 * Colours are palette keys, not hex values. Storing hex would break the print
 * theme, which has to redraw the same diagram with outlined tokens on white.
 * "standaard" means: follow the side the entity belongs to.
 */
export const TOKEN_COLORS = ['standaard', 'geel', 'paars', 'wit', 'grijs'] as const
export const colorSchema = z.enum(TOKEN_COLORS)
export type TokenColor = z.infer<typeof colorSchema>

const entityBase = {
  id: z.string().min(1),
  /** Draw order within the entity's own layer. */
  z: z.number().int(),
}

/* ------------------------------------------------------------------ player */

export const OFFENSE_ROLES = [
  'handler',
  'cutter',
  'deep',
  'wing',
  'popper',
  'hybride',
  'crasher',
] as const

export const DEFENSE_ROLES = ['cup', 'mark', 'mid', 'short-deep', 'deep-deep'] as const

export const playerRoleSchema = z.enum([...OFFENSE_ROLES, ...DEFENSE_ROLES])
export type PlayerRole = z.infer<typeof playerRoleSchema>

export const sideSchema = z.enum(['offense', 'defense'])
export type Side = z.infer<typeof sideSchema>

export const playerSchema = z.object({
  ...entityBase,
  type: z.literal('player'),
  pos: pointSchema,
  side: sideSchema,
  role: playerRoleSchema,
  /** Overrides the abbreviation derived from the role. */
  label: z.string().max(3).optional(),
  color: colorSchema,
  hasDisc: z.boolean(),
})
export type Player = z.infer<typeof playerSchema>

/* -------------------------------------------------------------------- cone */

export const coneSchema = z.object({
  ...entityBase,
  type: z.literal('cone'),
  pos: pointSchema,
  color: colorSchema,
})
export type Cone = z.infer<typeof coneSchema>

export const coneLineSchema = z.object({
  ...entityBase,
  type: z.literal('coneLine'),
  path: pathSchema,
  count: z.number().int().min(2).max(30),
  spacing: z.literal('even'),
  color: colorSchema,
})
export type ConeLine = z.infer<typeof coneLineSchema>

/* ------------------------------------------------------------------- arrow */

export const arrowKindSchema = z.enum(['cut', 'throw', 'juke', 'sight'])
export type ArrowKind = z.infer<typeof arrowKindSchema>

export const throwTypeSchema = z.enum(['backhand', 'forehand', 'hammer', 'scoober', 'blade'])
export type ThrowType = z.infer<typeof throwTypeSchema>

/** Arrows that move the player who owns them to a new position. */
export const MOVEMENT_KINDS = ['cut', 'juke'] as const

export const arrowSchema = z.object({
  ...entityBase,
  type: z.literal('arrow'),
  kind: arrowKindSchema,
  ownerId: z.string().min(1),
  targetId: z.string().min(1).optional(),
  path: pathSchema,
  throwType: throwTypeSchema.optional(),
  label: z.string().max(24).optional(),
  chainNextId: z.string().min(1).optional(),
})
export type Arrow = z.infer<typeof arrowSchema>

/* -------------------------------------------------------------- annotation */

export const annotationSchema = z.object({
  ...entityBase,
  type: z.literal('annotation'),
  shape: z.enum(['freehand', 'line', 'rect', 'ellipse', 'arrow']),
  points: z.array(pointSchema).min(2),
  style: z.object({
    stroke: colorSchema,
    /** Stroke width in metres, so it scales with the field. */
    width: z.number().positive().max(5),
    fill: colorSchema.optional(),
    dash: z.boolean().optional(),
    opacity: z.number().min(0).max(1),
  }),
})
export type Annotation = z.infer<typeof annotationSchema>

/* -------------------------------------------------------------------- text */

export const textSchema = z.object({
  ...entityBase,
  type: z.literal('text'),
  pos: pointSchema,
  content: z.string().min(1).max(280),
  size: z.enum(['sm', 'md', 'lg']),
  weight: z.enum(['normaal', 'halfvet']),
  color: colorSchema,
  align: z.enum(['links', 'midden', 'rechts']),
})
export type TextBlock = z.infer<typeof textSchema>

/* ------------------------------------------------------------------ entity */

export const entitySchema = z.discriminatedUnion('type', [
  playerSchema,
  coneSchema,
  coneLineSchema,
  arrowSchema,
  annotationSchema,
  textSchema,
])
export type Entity = z.infer<typeof entitySchema>
export type EntityType = Entity['type']

export function isPlayer(entity: Entity): entity is Player {
  return entity.type === 'player'
}

export function isArrow(entity: Entity): entity is Arrow {
  return entity.type === 'arrow'
}

/* ------------------------------------------------------------------- frame */

/**
 * Rules that no single entity can enforce on its own. These are the mistakes
 * that are invisible on screen and only show up on the field, so they are
 * checked on every save rather than only in the interface.
 */
export const frameContentSchema = z
  .object({ entities: z.array(entitySchema) })
  .superRefine((content, ctx) => {
    const seen = new Set<string>()
    for (const entity of content.entities) {
      if (seen.has(entity.id)) {
        ctx.addIssue({ code: 'custom', message: `Dubbel id: ${entity.id}`, path: ['entities'] })
      }
      seen.add(entity.id)
    }

    const players = content.entities.filter(isPlayer)
    const discCarriers = players.filter((p) => p.hasDisc)
    if (discCarriers.length > 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Meer dan één speler heeft de schijf.',
        path: ['entities'],
      })
    }

    const byId = new Map(content.entities.map((e) => [e.id, e]))
    for (const arrow of content.entities.filter(isArrow)) {
      const owner = byId.get(arrow.ownerId)
      if (!owner) {
        ctx.addIssue({
          code: 'custom',
          message: `Arrow ${arrow.id} hoort bij een entiteit die niet bestaat.`,
          path: ['entities'],
        })
        continue
      }
      if (arrow.kind === 'throw') {
        if (!isPlayer(owner) || !owner.hasDisc) {
          ctx.addIssue({
            code: 'custom',
            message: `Arrow ${arrow.id} is een worp vanuit iemand zonder schijf.`,
            path: ['entities'],
          })
        }
      }
      if (arrow.targetId && !byId.has(arrow.targetId)) {
        ctx.addIssue({
          code: 'custom',
          message: `Arrow ${arrow.id} wijst naar een entiteit die niet bestaat.`,
          path: ['entities'],
        })
      }
    }
  })

export type FrameContent = z.infer<typeof frameContentSchema>

export const emptyFrameContent = (): FrameContent => ({ entities: [] })

/* --------------------------------------------------------- diagram metadata */

export const weergaveSchema = z.enum(['volledig', 'half', 'vrij'])
export const tokenstijlSchema = z.enum(['letters', 'xo', 'blanco'])
export const diagramTypeSchema = z.enum(['speelvariant', 'drill'])
export const statusSchema = z.enum(['geintroduceerd', 'geoefend', 'ingeoefend'])

export type Weergave = z.infer<typeof weergaveSchema>
export type Tokenstijl = z.infer<typeof tokenstijlSchema>
export type DiagramType = z.infer<typeof diagramTypeSchema>
export type DiagramStatus = z.infer<typeof statusSchema>

export const SPEELVARIANT_CATEGORIEEN = [
  'vertical stack',
  'horizontal stack',
  'side stack',
  'endzone-set',
  'zoneaanval',
  'manverdediging',
  'zoneverdediging',
  'pull play',
  'transitie',
] as const

export const DRILL_CATEGORIEEN = [
  'opwarming',
  'worptechniek',
  'cutten',
  'verdediging',
  'conditie',
  'spelvorm',
  'afwerking endzone',
] as const

export function categorieenVoor(type: DiagramType): readonly string[] {
  return type === 'speelvariant' ? SPEELVARIANT_CATEGORIEEN : DRILL_CATEGORIEEN
}
