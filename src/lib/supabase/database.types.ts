/**
 * Hand-kept subset of the generated Supabase types: only the tables the
 * application touches today. Regenerate in full when the schema grows.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Profile {
  id: string
  naam: string | null
  email: string | null
  can_edit: boolean
  aangemaakt_op: string
}

export interface DiagramRow {
  id: string
  auteur_id: string
  naam: string
  type: string | null
  categorie: string | null
  niveau: string | null
  tags: string[]
  aantal_spelers: number | null
  materiaal: string | null
  weergave: string
  tokenstijl: string
  draft: boolean
  favoriet: boolean
  status: string | null
  status_bijgewerkt_op: string | null
  aangemaakt_op: string
  gewijzigd_op: string
}

export interface FrameRow {
  id: string
  diagram_id: string
  volgorde: number
  duur_ms: number
  toelichting: string | null
  content: Json
  schema_version: number
}
