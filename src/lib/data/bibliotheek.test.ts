import { describe, expect, it } from 'vitest'
import {
  categorieenIn,
  filterDiagrammen,
  isLeeg,
  LEEG_FILTER,
  normaliseer,
  pastBijFilter,
  sorteerDiagrammen,
  type Filter,
  type Zoekbaar,
} from './bibliotheek'

const diagram = (over: Partial<Zoekbaar> = {}): Zoekbaar => ({
  naam: 'Vertical stack basis',
  type: 'speelvariant',
  categorie: 'vertical stack',
  tags: [],
  favoriet: false,
  gewijzigd_op: '2026-09-01T10:00:00Z',
  ...over,
})

const filter = (over: Partial<Filter> = {}): Filter => ({ ...LEEG_FILTER, ...over })

describe('normaliseren', () => {
  it('haalt hoofdletters en accenten weg', () => {
    expect(normaliseer('  Privé Oefening ')).toBe('prive oefening')
  })
})

describe('zoeken', () => {
  it('vindt op een stuk van de naam', () => {
    expect(pastBijFilter(diagram(), filter({ zoek: 'stack' }))).toBe(true)
  })

  it('trekt zich niets aan van hoofdletters', () => {
    expect(pastBijFilter(diagram(), filter({ zoek: 'VERTICAL' }))).toBe(true)
  })

  it('vindt op een tag', () => {
    const d = diagram({ naam: 'Zonder naam', tags: ['pull play', 'wind'] })
    expect(pastBijFilter(d, filter({ zoek: 'wind' }))).toBe(true)
  })

  it('vindt op de categorie', () => {
    const d = diagram({ naam: 'Naamloos', categorie: 'endzone-set' })
    expect(pastBijFilter(d, filter({ zoek: 'endzone' }))).toBe(true)
  })

  it('versmalt met een tweede woord in plaats van te verbreden', () => {
    const d = diagram({ naam: 'Vertical stack basis', tags: ['wind'] })
    expect(pastBijFilter(d, filter({ zoek: 'stack wind' }))).toBe(true)
    expect(pastBijFilter(d, filter({ zoek: 'stack regen' }))).toBe(false)
  })

  it('laat alles door bij een lege zoekterm', () => {
    expect(pastBijFilter(diagram(), filter({ zoek: '   ' }))).toBe(true)
  })
})

describe('filteren', () => {
  it('houdt alleen speelvarianten over', () => {
    const lijst = [diagram(), diagram({ type: 'drill', categorie: 'opwarming' })]
    expect(filterDiagrammen(lijst, filter({ soort: 'speelvariant' }))).toHaveLength(1)
  })

  it('houdt alleen favorieten over', () => {
    const lijst = [diagram(), diagram({ favoriet: true, naam: 'Ster' })]
    const uit = filterDiagrammen(lijst, filter({ soort: 'favoriet' }))
    expect(uit.map((d) => d.naam)).toEqual(['Ster'])
  })

  it('combineert categorie met een zoekterm', () => {
    const lijst = [
      diagram({ naam: 'Hoekje', categorie: 'endzone-set' }),
      diagram({ naam: 'Andere', categorie: 'endzone-set' }),
      diagram({ naam: 'Hoekje', categorie: 'pull play' }),
    ]
    const uit = filterDiagrammen(lijst, filter({ zoek: 'hoekje', categorie: 'endzone-set' }))
    expect(uit).toHaveLength(1)
  })
})

describe('volgorde', () => {
  it('zet favorieten voorop en daarbinnen het recentste eerst', () => {
    const lijst = [
      diagram({ naam: 'oud', gewijzigd_op: '2026-01-01T00:00:00Z' }),
      diagram({ naam: 'nieuw', gewijzigd_op: '2026-08-01T00:00:00Z' }),
      diagram({ naam: 'ster oud', favoriet: true, gewijzigd_op: '2026-02-01T00:00:00Z' }),
      diagram({ naam: 'ster nieuw', favoriet: true, gewijzigd_op: '2026-07-01T00:00:00Z' }),
    ]
    expect(sorteerDiagrammen(lijst).map((d) => d.naam)).toEqual([
      'ster nieuw',
      'ster oud',
      'nieuw',
      'oud',
    ])
  })

  it('laat de meegegeven lijst met rust', () => {
    const lijst = [diagram({ naam: 'a' }), diagram({ naam: 'b', favoriet: true })]
    sorteerDiagrammen(lijst)
    expect(lijst.map((d) => d.naam)).toEqual(['a', 'b'])
  })
})

describe('categorieën', () => {
  it('geeft alleen wat werkelijk voorkomt, alfabetisch', () => {
    const lijst = [
      diagram({ categorie: 'zoneaanval' }),
      diagram({ categorie: 'endzone-set' }),
      diagram({ categorie: 'endzone-set' }),
    ]
    expect(categorieenIn(lijst, 'alles')).toEqual(['endzone-set', 'zoneaanval'])
  })

  it('kijkt alleen binnen de gekozen soort', () => {
    const lijst = [
      diagram({ type: 'speelvariant', categorie: 'pull play' }),
      diagram({ type: 'drill', categorie: 'opwarming' }),
    ]
    expect(categorieenIn(lijst, 'drill')).toEqual(['opwarming'])
  })
})

describe('leeg filter', () => {
  it('herkent dat er niets gefilterd wordt', () => {
    expect(isLeeg(LEEG_FILTER)).toBe(true)
    expect(isLeeg(filter({ zoek: 'x' }))).toBe(false)
    expect(isLeeg(filter({ soort: 'favoriet' }))).toBe(false)
  })
})
