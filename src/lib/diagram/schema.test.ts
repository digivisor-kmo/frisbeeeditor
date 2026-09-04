import { describe, expect, it } from 'vitest'
import {
  arrowSchema,
  categorieenVoor,
  entitySchema,
  frameContentSchema,
  pathSchema,
  playerSchema,
  type Entity,
} from './schema'

const player = (id: string, over: Partial<Record<string, unknown>> = {}) => ({
  id,
  z: 0,
  type: 'player' as const,
  pos: { x: 30, y: 18.5 },
  side: 'offense' as const,
  role: 'handler' as const,
  color: 'standaard' as const,
  hasDisc: false,
  ...over,
})

const arrow = (id: string, over: Partial<Record<string, unknown>> = {}) => ({
  id,
  z: 0,
  type: 'arrow' as const,
  kind: 'cut' as const,
  ownerId: 'p1',
  path: { points: [{ x: 30, y: 18.5 }, { x: 40, y: 25 }] },
  ...over,
})

describe('losse entiteiten', () => {
  it('accepteert een geldige speler', () => {
    expect(playerSchema.safeParse(player('p1')).success).toBe(true)
  })

  it('weigert een onbekende positie', () => {
    expect(playerSchema.safeParse(player('p1', { role: 'quarterback' })).success).toBe(false)
  })

  it('weigert een hexkleur, want kleuren zijn palletsleutels', () => {
    expect(playerSchema.safeParse(player('p1', { color: '#ff0000' })).success).toBe(false)
  })

  it('vraagt minstens twee punten voor een pad', () => {
    expect(pathSchema.safeParse({ points: [{ x: 1, y: 1 }] }).success).toBe(false)
    expect(pathSchema.safeParse({ points: [{ x: 1, y: 1 }, { x: 2, y: 2 }] }).success).toBe(true)
  })

  it('herkent het type via de discriminant', () => {
    const parsed = entitySchema.parse(player('p1'))
    expect(parsed.type).toBe('player')
  })

  it('laat throwType weg bij een cut', () => {
    expect(arrowSchema.safeParse(arrow('a1')).success).toBe(true)
  })
})

describe('frame-invarianten', () => {
  const parse = (entities: unknown[]) => frameContentSchema.safeParse({ entities })

  it('accepteert een leeg frame', () => {
    expect(parse([]).success).toBe(true)
  })

  it('weigert twee entiteiten met hetzelfde id', () => {
    const result = parse([player('p1'), player('p1')])
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('Dubbel id')
  })

  it('weigert twee spelers met de schijf', () => {
    const result = parse([player('p1', { hasDisc: true }), player('p2', { hasDisc: true })])
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('schijf')
  })

  it('weigert een arrow zonder eigenaar', () => {
    const result = parse([arrow('a1', { ownerId: 'bestaat-niet' })])
    expect(result.success).toBe(false)
  })

  it('weigert een worp vanuit iemand zonder schijf', () => {
    const result = parse([player('p1'), arrow('a1', { kind: 'throw', ownerId: 'p1' })])
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('zonder schijf')
  })

  it('accepteert een worp vanuit de schijfdrager', () => {
    const result = parse([
      player('p1', { hasDisc: true }),
      player('p2'),
      arrow('a1', { kind: 'throw', ownerId: 'p1', targetId: 'p2', throwType: 'forehand' }),
    ])
    expect(result.success).toBe(true)
  })

  it('weigert een arrow die naar een onbestaande entiteit wijst', () => {
    const result = parse([
      player('p1', { hasDisc: true }),
      arrow('a1', { kind: 'throw', ownerId: 'p1', targetId: 'p9' }),
    ])
    expect(result.success).toBe(false)
  })

  it('overleeft een rondje door JSON, want zo staat het in de database', () => {
    const entities: Entity[] = [
      entitySchema.parse(player('p1', { hasDisc: true })),
      entitySchema.parse(arrow('a1', { kind: 'juke' })),
    ]
    const roundTrip = JSON.parse(JSON.stringify({ entities }))
    expect(frameContentSchema.safeParse(roundTrip).success).toBe(true)
  })
})

describe('categorieën', () => {
  it('geeft andere lijsten voor varianten en drills', () => {
    expect(categorieenVoor('speelvariant')).toContain('vertical stack')
    expect(categorieenVoor('drill')).toContain('worptechniek')
    expect(categorieenVoor('drill')).not.toContain('vertical stack')
  })
})
