import { describe, expect, it } from 'vitest'
import {
  aanvalsRichting,
  arrowBend,
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
    expect(arrowBend(arrow)).toBeNull()
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

    expect(arrowBend(backhand)).not.toBeNull()
    expect(arrowBend(forehand)).not.toBeNull()
    // Een forehand buigt de andere kant op dan een backhand.
    expect(arrowBend(backhand)!.y - van.y).toBeGreaterThan(0)
    expect(arrowBend(forehand)!.y - van.y).toBeLessThan(0)
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
