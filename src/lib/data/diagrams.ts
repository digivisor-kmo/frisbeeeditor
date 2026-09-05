'use client'

import { occupancy } from '@/lib/diagram/entities'
import { frameContentSchema, SCHEMA_VERSION } from '@/lib/diagram/schema'
import type { EditorDoc } from '@/lib/editor/document'
import { claimSlot, SlotKwijtError } from '@/lib/data/vergrendeling'
import { createClient } from '@/lib/supabase/client'
import type { DiagramRow, FrameRow } from '@/lib/supabase/database.types'

export interface DiagramSamenvatting {
  id: string
  naam: string
  type: string | null
  categorie: string | null
  weergave: string
  draft: boolean
  favoriet: boolean
  gewijzigd_op: string
}

export async function lijstDiagrammen(): Promise<DiagramSamenvatting[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('diagrams')
    .select('id, naam, type, categorie, weergave, draft, favoriet, gewijzigd_op')
    .order('gewijzigd_op', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as DiagramSamenvatting[]
}

export async function maakDiagram(doc: EditorDoc): Promise<string> {
  const supabase = createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Niet ingelogd.')

  const { data, error } = await supabase
    .from('diagrams')
    .insert({
      auteur_id: userData.user.id,
      naam: doc.meta.naam,
      type: doc.meta.type,
      categorie: doc.meta.categorie,
      weergave: doc.meta.weergave,
      tokenstijl: doc.meta.tokenstijl,
      draft: doc.meta.draft,
      tags: doc.meta.tags,
    })
    .select('id')
    .single<{ id: string }>()

  if (error || !data) throw new Error(error?.message ?? 'Aanmaken mislukt.')

  // Writing frames needs the lock, and the one who just made the diagram is
  // the one who is about to open it.
  await claimSlot(data.id)

  const frames = doc.frames.map((frame, index) => ({
    diagram_id: data.id,
    volgorde: index,
    duur_ms: frame.duurMs,
    toelichting: frame.toelichting,
    content: frame.content,
    schema_version: SCHEMA_VERSION,
  }))

  const { error: frameError } = await supabase.from('frames').insert(frames)
  if (frameError) throw new Error(frameError.message)

  return data.id
}

/** Postgres reports a missing lock as a row level security violation. */
const isSlotFout = (bericht: string): boolean =>
  bericht.toLowerCase().includes('row-level security') ||
  bericht.toLowerCase().includes('row level security')

export async function laadDiagram(id: string): Promise<EditorDoc> {
  const supabase = createClient()

  const { data: diagram, error } = await supabase
    .from('diagrams')
    .select('*')
    .eq('id', id)
    .single<DiagramRow>()
  if (error || !diagram) throw new Error(error?.message ?? 'Diagram niet gevonden.')

  const { data: frames, error: frameError } = await supabase
    .from('frames')
    .select('*')
    .eq('diagram_id', id)
    .order('volgorde', { ascending: true })
    .returns<FrameRow[]>()
  if (frameError) throw new Error(frameError.message)

  return {
    id: diagram.id,
    meta: {
      naam: diagram.naam,
      type: (diagram.type as EditorDoc['meta']['type']) ?? null,
      categorie: diagram.categorie,
      niveau: diagram.niveau,
      tags: diagram.tags ?? [],
      weergave: diagram.weergave as EditorDoc['meta']['weergave'],
      tokenstijl: diagram.tokenstijl as EditorDoc['meta']['tokenstijl'],
      draft: diagram.draft,
    },
    frames: (frames ?? []).map((frame) => ({
      id: frame.id,
      duurMs: frame.duur_ms,
      toelichting: frame.toelichting,
      // Anything that comes back from the database goes through the schema
      // before the editor touches it.
      content: frameContentSchema.parse(frame.content),
    })),
  }
}

/**
 * Writes a diagram, and only the parts of it that actually changed.
 *
 * A frame carries the whole field as jsonb. Sending all ten of them every two
 * seconds of drawing is a payload that grows with the diagram and a database
 * that rewrites rows nobody touched. Immer's structural sharing makes the
 * comparison exact and free: a frame that was not edited is literally the same
 * object it was at the last save.
 */
export async function bewaarDiagram(doc: EditorDoc, vorige?: EditorDoc | null): Promise<void> {
  if (!doc.id) throw new Error('Diagram heeft nog geen id.')
  const supabase = createClient()

  const zelfdeDiagram = vorige?.id === doc.id ? vorige : null
  const spelers = occupancy(doc.frames[0]?.content.entities ?? [])

  const metaGewijzigd =
    !zelfdeDiagram ||
    zelfdeDiagram.meta !== doc.meta ||
    zelfdeDiagram.frames[0]?.content !== doc.frames[0]?.content

  if (metaGewijzigd) {
    const { error } = await supabase
      .from('diagrams')
      .update({
        naam: doc.meta.naam,
        type: doc.meta.type,
        categorie: doc.meta.categorie,
        niveau: doc.meta.niveau,
        tags: doc.meta.tags,
        weergave: doc.meta.weergave,
        tokenstijl: doc.meta.tokenstijl,
        draft: doc.meta.draft,
        aantal_spelers: spelers.offense,
      })
      .eq('id', doc.id)
    if (error) throw new Error(error.message)
  }

  const vorigeFrames = new Map(zelfdeDiagram?.frames.map((f, i) => [f.id, { frame: f, index: i }]))

  // Validate before writing: the frame invariants are the last line of defence
  // before a broken diagram lands in the database.
  const rijen = doc.frames
    .map((frame, index) => ({ frame, index }))
    .filter(({ frame, index }) => {
      const vorig = vorigeFrames.get(frame.id)
      if (!vorig) return true
      return (
        vorig.index !== index ||
        vorig.frame.content !== frame.content ||
        vorig.frame.duurMs !== frame.duurMs ||
        vorig.frame.toelichting !== frame.toelichting
      )
    })
    .map(({ frame, index }) => ({
      id: frame.id,
      diagram_id: doc.id!,
      volgorde: index,
      duur_ms: frame.duurMs,
      toelichting: frame.toelichting,
      content: frameContentSchema.parse(frame.content),
      schema_version: SCHEMA_VERSION,
    }))

  // One statement, so the deferred unique constraint on (diagram_id, volgorde)
  // is only checked once every row has moved. Reordering frames would trip it
  // halfway otherwise.
  let { error: frameError } = rijen.length > 0
    ? await supabase.from('frames').upsert(rijen)
    : { error: null as { message: string } | null }

  /*
   * A frame write needs a valid lock, and a tab that sat in a pocket for two
   * minutes no longer has one. Rather than claim the lock before every save —
   * a round trip every two seconds of drawing — we repair on failure: take the
   * lock back and try once more. Only when somebody else really holds it does
   * this become an error, and then it is a sentence about people, not a policy
   * violation in English.
   */
  if (frameError && isSlotFout(frameError.message)) {
    const slot = await claimSlot(doc.id)
    if (!slot.gelukt) throw new SlotKwijtError(slot.naam)
    ;({ error: frameError } = await supabase.from('frames').upsert(rijen))
  }

  if (frameError) throw new Error(frameError.message)

  // Only when a frame actually disappeared. Otherwise this is a delete that
  // scans the diagram's frames on every keystroke and never removes anything.
  const behouden = doc.frames.map((frame) => frame.id)
  const verdwenen =
    !zelfdeDiagram || zelfdeDiagram.frames.some((f) => !behouden.includes(f.id))

  if (verdwenen) {
    const { error: opruimError } = await supabase
      .from('frames')
      .delete()
      .eq('diagram_id', doc.id)
      .not('id', 'in', `(${behouden.join(',')})`)
    if (opruimError) throw new Error(opruimError.message)
  }
}

export async function verwijderDiagram(id: string): Promise<void> {
  const supabase = createClient()
  // Frames, playbook items and share links hang off the diagram with a cascade,
  // so this one statement takes the whole thing.
  const { error } = await supabase.from('diagrams').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** The star is shared: one flag on the diagram, the same for the whole club. */
export async function zetFavoriet(id: string, favoriet: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('diagrams').update({ favoriet }).eq('id', id)
  if (error) throw new Error(error.message)
}
