'use client'

import { occupancy } from '@/lib/diagram/entities'
import { frameContentSchema, SCHEMA_VERSION } from '@/lib/diagram/schema'
import type { EditorDoc } from '@/lib/editor/document'
import { createClient } from '@/lib/supabase/client'
import type { DiagramRow, FrameRow } from '@/lib/supabase/database.types'

export interface DiagramSamenvatting {
  id: string
  naam: string
  type: string | null
  categorie: string | null
  weergave: string
  draft: boolean
  gewijzigd_op: string
}

export async function lijstDiagrammen(): Promise<DiagramSamenvatting[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('diagrams')
    .select('id, naam, type, categorie, weergave, draft, gewijzigd_op')
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

export async function bewaarDiagram(doc: EditorDoc): Promise<void> {
  if (!doc.id) throw new Error('Diagram heeft nog geen id.')
  const supabase = createClient()

  const spelers = occupancy(doc.frames[0]?.content.entities ?? [])

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

  // Validate before writing: the frame invariants are the last line of defence
  // before a broken diagram lands in the database.
  const rijen = doc.frames.map((frame, index) => ({
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
  const { error: frameError } = await supabase.from('frames').upsert(rijen)
  if (frameError) throw new Error(frameError.message)

  const behouden = doc.frames.map((frame) => frame.id)
  const { error: opruimError } = await supabase
    .from('frames')
    .delete()
    .eq('diagram_id', doc.id)
    .not('id', 'in', `(${behouden.join(',')})`)
  if (opruimError) throw new Error(opruimError.message)
}

export async function verwijderDiagram(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('diagrams').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
