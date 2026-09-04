import { occupancy } from '@/lib/diagram/entities'
import { isArrow } from '@/lib/diagram/schema'
import { nl } from '@/lib/strings'
import type { EditorDoc } from './document'

export interface Ontbreekt {
  veld: 'naam' | 'type' | 'categorie' | 'spelers' | 'worp'
  tekst: string
}

/**
 * What is still missing before this diagram is complete.
 *
 * With autosave there is no save moment left to complain at, so this counter is
 * the only thing that makes a half-finished diagram visible.
 */
export function watOntbreekt(doc: EditorDoc): Ontbreekt[] {
  const ontbreekt: Ontbreekt[] = []

  if (doc.meta.naam.trim() === '') {
    ontbreekt.push({ veld: 'naam', tekst: 'Geef het diagram een naam' })
  }
  if (!doc.meta.type) {
    ontbreekt.push({ veld: 'type', tekst: 'Kies speelvariant of drill' })
  }
  if (!doc.meta.categorie) {
    ontbreekt.push({ veld: 'categorie', tekst: 'Kies een categorie' })
  }

  const entities = doc.frames[0]?.content.entities ?? []
  const { offense, defense } = occupancy(entities)
  if (offense + defense === 0) {
    ontbreekt.push({ veld: 'spelers', tekst: 'Zet minstens één speler op het veld' })
  }

  // A throw without a receiver hands the disc to nobody and animates nothing.
  // Without this line that failure is completely silent.
  const los = doc.frames.reduce(
    (som, frame) =>
      som +
      frame.content.entities.filter((e) => isArrow(e) && e.kind === 'throw' && !e.targetId).length,
    0,
  )
  if (los > 0) ontbreekt.push({ veld: 'worp', tekst: nl.validatie.losseWorp(los) })

  return ontbreekt
}

export const isCompleet = (doc: EditorDoc): boolean => watOntbreekt(doc).length === 0
