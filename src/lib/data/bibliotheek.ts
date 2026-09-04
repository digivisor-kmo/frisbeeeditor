/**
 * Finding a diagram back: search, filter and order for the library.
 *
 * Deliberately all in memory. A club of ten trainers builds hundreds of
 * diagrams, not hundreds of thousands, so the whole list is already on the page
 * and filtering it in the browser is instant and needs no round trip.
 */

export interface Zoekbaar {
  naam: string
  type: string | null
  categorie: string | null
  tags: string[]
  favoriet: boolean
  gewijzigd_op: string
}

/**
 * Lower case, without accents. A trainer types "endzone" and should find
 * "Endzone", and "prive" should find "privé": nobody reaches for the accent key
 * with cold hands beside a field.
 */
export function normaliseer(tekst: string): string {
  return tekst
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export type Soort = 'alles' | 'speelvariant' | 'drill' | 'favoriet'

export interface Filter {
  zoek: string
  soort: Soort
  categorie: string | null
}

export const LEEG_FILTER: Filter = { zoek: '', soort: 'alles', categorie: null }

export const isLeeg = (filter: Filter): boolean =>
  filter.zoek.trim() === '' && filter.soort === 'alles' && filter.categorie === null

/** Everything about a diagram that a search term may land on. */
const hooiberg = (diagram: Zoekbaar): string =>
  normaliseer([diagram.naam, diagram.categorie ?? '', diagram.type ?? '', ...diagram.tags].join(' '))

export function pastBijFilter(diagram: Zoekbaar, filter: Filter): boolean {
  if (filter.soort === 'favoriet' && !diagram.favoriet) return false
  if ((filter.soort === 'speelvariant' || filter.soort === 'drill') && diagram.type !== filter.soort) {
    return false
  }
  if (filter.categorie !== null && diagram.categorie !== filter.categorie) return false

  // Every word has to land somewhere, so a second word narrows down instead of
  // widening. "endzone hoek" finds only what is both.
  const woorden = normaliseer(filter.zoek).split(/\s+/).filter(Boolean)
  if (woorden.length === 0) return true

  const tekst = hooiberg(diagram)
  return woorden.every((woord) => tekst.includes(woord))
}

/** Favourites first, and inside each group the most recently changed first. */
export function sorteerDiagrammen<T extends Zoekbaar>(lijst: readonly T[]): T[] {
  return [...lijst].sort((a, b) => {
    if (a.favoriet !== b.favoriet) return a.favoriet ? -1 : 1
    return b.gewijzigd_op.localeCompare(a.gewijzigd_op)
  })
}

export function filterDiagrammen<T extends Zoekbaar>(lijst: readonly T[], filter: Filter): T[] {
  return sorteerDiagrammen(lijst.filter((diagram) => pastBijFilter(diagram, filter)))
}

/**
 * The categories that actually occur, so the list never offers a filter that
 * comes back empty.
 */
export function categorieenIn(lijst: readonly Zoekbaar[], soort: Soort): string[] {
  const gevonden = new Set<string>()
  for (const diagram of lijst) {
    if (!diagram.categorie) continue
    if ((soort === 'speelvariant' || soort === 'drill') && diagram.type !== soort) continue
    if (soort === 'favoriet' && !diagram.favoriet) continue
    gevonden.add(diagram.categorie)
  }
  return [...gevonden].sort((a, b) => a.localeCompare(b, 'nl'))
}
