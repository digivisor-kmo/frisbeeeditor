import { describe, expect, it } from 'vitest'
import {
  aanvalsRichting,
  arrowBochten,
  bochtIndices,
  MAX_BOCHTEN,
  segmentAantal,
  verwijderBocht,
  voegBochtToe,
  arrowEnd,
  arrowStart,
  createArrow,
  NIEUWE_ARROW_LENGTE_M,
  snapThrowEnd,
  tekenbareArrows,
  THROW_KROMMING,
  THROW_SNAP_M,
  verplaatsArrow,
} from './arrows'
import { createPlayer } from './entities'
import { entitySchema, frameContentSchema, type Entity } from './schema'

const speler = (id: string, x: number, y: number, over: Partial<{ hasDisc: boolean }> = {}) => ({
  ...createPlayer({ id, pos: { x, y }, side: 'offense' as const, entities: [] }),
  ...over,
})

describe('richting van een nieuwe arrow', () => {
  it('wijst naar de endzone die wordt aangevallen', () => {
    expect(aanvalsRichting('volledig')).toEqual({ x: 1, y: 0 })
    expect(aanvalsRichting('vrij')).toEqual({ x: 1, y: 0 })
    // Half veld staat staand met de endzone bovenaan, dus richting x = 0.
    expect(aanvalsRichting('half')).toEqual({ x: -1, y: 0 })
  })
})

describe('createArrow', () => {
  const van = { x: 40, y: 18.5 }

  it('maakt een rechte cut van twee punten', () => {
    const arrow = createArrow({
      id: 'a1',
      ownerId: 'p1',
      van,
      kind: 'cut',
      weergave: 'volledig',
      entities: [],
    })
    expect(arrow.path.points).toHaveLength(2)
    expect(arrowBochten(arrow)).toHaveLength(0)
    expect(arrowEnd(arrow).x).toBeCloseTo(van.x + NIEUWE_ARROW_LENGTE_M, 6)
  })

  it('begint bij de speler zelf', () => {
    const arrow = createArrow({
      id: 'a1',
      ownerId: 'p1',
      van,
      kind: 'juke',
      weergave: 'volledig',
      entities: [],
    })
    expect(arrowStart(arrow)).toEqual(van)
  })

  it('geeft een worp meteen een bocht, met de richting van het worptype', () => {
    const backhand = createArrow({
      id: 'a1',
      ownerId: 'p1',
      van,
      kind: 'throw',
      weergave: 'volledig',
      entities: [],
      throwType: 'backhand',
    })
    const forehand = createArrow({
      id: 'a2',
      ownerId: 'p1',
      van,
      kind: 'throw',
      weergave: 'volledig',
      entities: [],
      throwType: 'forehand',
    })

    expect(arrowBochten(backhand)).toHaveLength(1)
    expect(arrowBochten(forehand)).toHaveLength(1)
    // Een forehand buigt de andere kant op dan een backhand.
    expect(arrowBochten(backhand)[0]!.y - van.y).toBeGreaterThan(0)
    expect(arrowBochten(forehand)[0]!.y - van.y).toBeLessThan(0)
  })

  it('buigt een hammer sterker dan een blade', () => {
    expect(Math.abs(THROW_KROMMING.hammer)).toBeGreaterThan(Math.abs(THROW_KROMMING.blade))
  })

  it('is lang genoeg om de punt naast het token te krijgen', () => {
    // Een token is hooguit 1,6 meter straal; de punt moet daar ruim buiten vallen.
    expect(NIEUWE_ARROW_LENGTE_M).toBeGreaterThan(4)
  })

  it('blijft binnen het veld, ook vlak bij de zijlijn', () => {
    const arrow = createArrow({
      id: 'a1',
      ownerId: 'p1',
      van: { x: 96, y: 36 },
      kind: 'throw',
      weergave: 'volledig',
      entities: [],
      throwType: 'hammer',
    })
    for (const punt of arrow.path.points) {
      expect(punt.x).toBeLessThanOrEqual(100)
      expect(punt.y).toBeLessThanOrEqual(37)
    }
  })

  it('levert een entiteit op die door het schema komt', () => {
    const arrow = createArrow({
      id: 'a1',
      ownerId: 'p1',
      van,
      kind: 'cut',
      weergave: 'volledig',
      entities: [],
    })
    expect(entitySchema.safeParse(arrow).success).toBe(true)
  })

  it('past in een geldig frame samen met zijn eigenaar', () => {
    const p = speler('p1', 40, 18.5, { hasDisc: true })
    const arrow = createArrow({
      id: 'a1',
      ownerId: 'p1',
      van: p.pos,
      kind: 'throw',
      weergave: 'volledig',
      entities: [p],
    })
    expect(frameContentSchema.safeParse({ entities: [p, arrow] }).success).toBe(true)
  })
})

describe('snappen van een worp', () => {
  const entities: Entity[] = [speler('p1', 40, 18.5, { hasDisc: true }), speler('p2', 50, 20)]

  it('klikt vast op een speler die dichtbij genoeg staat', () => {
    const result = snapThrowEnd({ x: 50.8, y: 20.4 }, entities, 'p1')
    expect(result.targetId).toBe('p2')
    expect(result.pos).toEqual({ x: 50, y: 20 })
  })

  it('laat los zodra de speler te ver weg staat', () => {
    const ver = { x: 50 + THROW_SNAP_M + 0.5, y: 20 }
    const result = snapThrowEnd(ver, entities, 'p1')
    expect(result.targetId).toBeUndefined()
    expect(result.pos).toEqual(ver)
  })

  it('snapt nooit naar de werper zelf', () => {
    const result = snapThrowEnd({ x: 40.1, y: 18.5 }, entities, 'p1')
    expect(result.targetId).toBeUndefined()
  })

  it('kiest de dichtstbijzijnde als er twee in de buurt staan', () => {
    const dichterbij = speler('p3', 51, 20)
    const result = snapThrowEnd({ x: 50.9, y: 20 }, [...entities, dichterbij], 'p1')
    expect(result.targetId).toBe('p3')
  })

  it('klikt vast op het eindpunt van de cut van een speler', () => {
    const cut = createArrow({
      id: 'a1',
      ownerId: 'p2',
      van: { x: 50, y: 20 },
      kind: 'cut',
      weergave: 'volledig',
      entities: [],
    })
    cut.path.points = [
      { x: 50, y: 20 },
      { x: 70, y: 8 },
    ]

    const result = snapThrowEnd({ x: 70.4, y: 8.3 }, [...entities, cut], 'p1')
    expect(result.targetId).toBe('p2')
    expect(result.pos).toEqual({ x: 70, y: 8 })
  })

  it('kiest tussen de speler en zijn eindpunt wat het dichtst ligt', () => {
    const cut = createArrow({
      id: 'a1',
      ownerId: 'p2',
      van: { x: 50, y: 20 },
      kind: 'cut',
      weergave: 'volledig',
      entities: [],
    })
    cut.path.points = [
      { x: 50, y: 20 },
      { x: 51, y: 20 },
    ]

    const result = snapThrowEnd({ x: 50.2, y: 20 }, [...entities, cut], 'p1')
    expect(result.pos).toEqual({ x: 50, y: 20 })
  })
})

describe('arrow meeverplaatsen', () => {
  it('schuift het hele pad mee met de speler', () => {
    const arrow = createArrow({
      id: 'a1',
      ownerId: 'p1',
      van: { x: 40, y: 18.5 },
      kind: 'cut',
      weergave: 'volledig',
      entities: [],
    })
    const eindVoor = { ...arrowEnd(arrow) }
    verplaatsArrow(arrow, { x: 2, y: -1 })
    expect(arrowStart(arrow)).toEqual({ x: 42, y: 17.5 })
    expect(arrowEnd(arrow).x).toBeCloseTo(eindVoor.x + 2, 6)
    expect(arrowEnd(arrow).y).toBeCloseTo(eindVoor.y - 1, 6)
  })
})

describe('welke arrows een speler mag tekenen', () => {
  it('geeft de worp alleen aan wie de schijf heeft', () => {
    expect(tekenbareArrows(false)).toEqual(['cut', 'juke'])
    expect(tekenbareArrows(true)).toContain('throw')
  })
})

describe('bochtpunten', () => {
  const recht = () =>
    createArrow({
      id: 'a1',
      ownerId: 'p1',
      van: { x: 20, y: 18.5 },
      kind: 'cut',
      weergave: 'volledig',
      entities: [],
    })

  it('houdt het aantal handvatten kloppend: n bochten geeft n + 1 segmenten', () => {
    const arrow = recht()
    expect(arrowBochten(arrow)).toHaveLength(0)
    expect(segmentAantal(arrow)).toBe(1)

    voegBochtToe(arrow, 0, { x: 26, y: 22 })
    expect(arrowBochten(arrow)).toHaveLength(1)
    expect(segmentAantal(arrow)).toBe(2)

    voegBochtToe(arrow, 1, { x: 29, y: 15 })
    expect(arrowBochten(arrow)).toHaveLength(2)
    expect(segmentAantal(arrow)).toBe(3)
  })

  it('voegt de bocht toe in het segment waar je hem sleept', () => {
    const arrow = recht()
    voegBochtToe(arrow, 0, { x: 26, y: 22 })
    // Een bocht in het eerste segment komt vóór de bestaande bocht te staan.
    const index = voegBochtToe(arrow, 0, { x: 22, y: 20 })
    expect(index).toBe(1)
    expect(arrow.path.points[1]).toEqual({ x: 22, y: 20 })
    expect(arrow.path.points[2]).toEqual({ x: 26, y: 22 })
  })

  it('houdt begin en eind altijd op hun plek', () => {
    const arrow = recht()
    const start = { ...arrow.path.points[0]! }
    const eind = { ...arrow.path.points[arrow.path.points.length - 1]! }
    voegBochtToe(arrow, 0, { x: 26, y: 22 })
    voegBochtToe(arrow, 1, { x: 29, y: 15 })
    expect(arrow.path.points[0]).toEqual(start)
    expect(arrow.path.points[arrow.path.points.length - 1]).toEqual(eind)
  })

  it('stopt bij het maximum', () => {
    const arrow = recht()
    for (let i = 0; i < MAX_BOCHTEN; i++) {
      expect(voegBochtToe(arrow, 0, { x: 21 + i * 0.1, y: 19 })).not.toBeNull()
    }
    expect(voegBochtToe(arrow, 0, { x: 25, y: 19 })).toBeNull()
    expect(arrowBochten(arrow)).toHaveLength(MAX_BOCHTEN)
  })

  it('verwijdert precies die ene bocht', () => {
    const arrow = recht()
    voegBochtToe(arrow, 0, { x: 24, y: 22 })
    voegBochtToe(arrow, 1, { x: 28, y: 15 })
    expect(verwijderBocht(arrow, 1)).toBe(true)
    expect(arrowBochten(arrow)).toEqual([{ x: 28, y: 15 }])
  })

  it('weigert het begin of het eind te verwijderen', () => {
    const arrow = recht()
    voegBochtToe(arrow, 0, { x: 24, y: 22 })
    expect(verwijderBocht(arrow, 0)).toBe(false)
    expect(verwijderBocht(arrow, 2)).toBe(false)
    expect(arrow.path.points).toHaveLength(3)
  })

  it('geeft de indices van de bochten binnen het pad', () => {
    const arrow = recht()
    voegBochtToe(arrow, 0, { x: 24, y: 22 })
    voegBochtToe(arrow, 1, { x: 28, y: 15 })
    expect(bochtIndices(arrow)).toEqual([1, 2])
  })
})
