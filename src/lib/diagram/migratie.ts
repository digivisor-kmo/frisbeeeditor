import { frameContentSchema, type FrameContent } from './schema'

/**
 * Reads a frame that was written by an older version of the app.
 *
 * Version 1 had a `juke` arrow: a line with a wobble drawn over it. Version 2
 * dropped it, because a bend point says the same thing and can be put where you
 * want it. An old juke becomes a curve — same path, same endpoint, so the
 * player still arrives where the diagram always said he would.
 *
 * This runs before validation, not after: an unknown kind would be rejected by
 * the schema, and a trainer would open a diagram from last month to find it
 * empty.
 */
export function leesFrameContent(ruw: unknown, versie: number): FrameContent {
  return frameContentSchema.parse(versie >= 2 ? ruw : naarVersie2(ruw))
}

function naarVersie2(ruw: unknown): unknown {
  if (!isObject(ruw) || !Array.isArray(ruw.entities)) return ruw
  return {
    ...ruw,
    entities: ruw.entities.map((entity) =>
      isObject(entity) && entity.type === 'arrow' && entity.kind === 'juke'
        ? { ...entity, kind: 'curve' }
        : entity,
    ),
  }
}

function isObject(waarde: unknown): waarde is Record<string, unknown> {
  return typeof waarde === 'object' && waarde !== null
}
