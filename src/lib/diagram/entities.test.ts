import { describe, expect, it } from 'vitest'
import { createCone, createPlayer, occupancy, TEAM_SIZE, tokenText } from './entities'
import { buildPreset } from './presets'
import { nextRole } from './roles'
import { frameContentSchema, isPlayer, type Entity, type Player } from './schema'

let counter = 0
const makeId = () => `e${++counter}`

describe('bezetting', () => {
  it('telt per kant en negeert pionnen', () => {
    const entities: Entity[] = []
    entities.push(createPlayer({ id: 'a', pos: { x: 1, y: 1 }, side: 'offense', entities }))
    entities.push(createPlayer({ id: 'b', pos: { x: 2, y: 1 }, side: 'offense', entities }))
    entities.push(createPlayer({ id: 'c', pos: { x: 3, y: 1 }, side: 'defense', entities }))
    entities.push(createCone({ id: 'd', pos: { x: 4, y: 1 }, entities }))

    expect(occupancy(entities)).toEqual({ offense: 2, defense: 1 })
  })
})

describe('positievolgorde', () => {
  it('loopt door de vaste opstelling H, H, H, C, C, D, W', () => {
    const roles = Array.from({ length: TEAM_SIZE }, (_, i) => nextRole('offense', i))
    expect(roles).toEqual(['handler', 'handler', 'handler', 'cutter', 'cutter', 'deep', 'wing'])
  })

  it('begint bij verdediging met de mark', () => {
    expect(nextRole('defense', 0)).toBe('mark')
  })

  it('begint opnieuw als er meer dan zeven staan', () => {
    expect(nextRole('offense', 7)).toBe('handler')
  })

  it('geeft de volgende geplaatste speler de juiste positie', () => {
    let entities: Entity[] = []
    for (let i = 0; i < 4; i++) {
      entities = [
        ...entities,
        createPlayer({ id: `p${i}`, pos: { x: i, y: 1 }, side: 'offense', entities }),
      ]
    }
    expect(entities.map((e) => (e as Player).role)).toEqual([
      'handler',
      'handler',
      'handler',
      'cutter',
    ])
  })

  it('geeft elke nieuwe entiteit een hogere z', () => {
    const entities: Entity[] = []
    const first = createPlayer({ id: 'a', pos: { x: 1, y: 1 }, side: 'offense', entities })
    const second = createCone({ id: 'b', pos: { x: 2, y: 1 }, entities: [first] })
    expect(second.z).toBeGreaterThan(first.z)
  })
})

describe('tokentekst', () => {
  const player = (over: Partial<Player> = {}): Player => ({
    id: 'p',
    type: 'player',
    z: 1,
    pos: { x: 1, y: 1 },
    side: 'offense',
    role: 'handler',
    color: 'standaard',
    hasDisc: false,
    ...over,
  })

  it('toont de afkorting bij letters', () => {
    expect(tokenText(player(), 'letters')).toBe('H')
    expect(tokenText(player({ role: 'short-deep', side: 'defense' }), 'letters')).toBe('SD')
  })

  it('laat een eigen label voorgaan op de positie', () => {
    expect(tokenText(player({ label: '7' }), 'letters')).toBe('7')
  })

  it('toont O en X bij de xo-stijl', () => {
    expect(tokenText(player(), 'xo')).toBe('O')
    expect(tokenText(player({ side: 'defense' }), 'xo')).toBe('X')
  })

  it('toont niets bij blanco', () => {
    expect(tokenText(player({ label: '7' }), 'blanco')).toBe('')
  })
})

describe('startopstellingen', () => {
  it('zet zeven tegen zeven neer plus twee pionnen', () => {
    const content = buildPreset('vertical-stack', 'volledig', makeId)
    expect(occupancy(content.entities)).toEqual({ offense: TEAM_SIZE, defense: TEAM_SIZE })
    expect(content.entities.filter((e) => e.type === 'cone')).toHaveLength(2)
  })

  it('geeft precies één speler de schijf', () => {
    const content = buildPreset('vertical-stack', 'volledig', makeId)
    expect(content.entities.filter((e) => isPlayer(e) && e.hasDisc)).toHaveLength(1)
  })

  it('levert een geldig frame op', () => {
    for (const opstelling of ['vertical-stack', 'horizontal-stack', 'leeg'] as const) {
      for (const weergave of ['volledig', 'half', 'vrij'] as const) {
        const result = frameContentSchema.safeParse(buildPreset(opstelling, weergave, makeId))
        expect(result.success, `${opstelling} op ${weergave}`).toBe(true)
      }
    }
  })

  it('houdt elke speler binnen het zichtbare veld, ook op het halve veld', () => {
    const grenzen = {
      volledig: { maxX: 100 },
      vrij: { maxX: 100 },
      half: { maxX: 50 },
    } as const

    for (const weergave of ['volledig', 'half', 'vrij'] as const) {
      for (const opstelling of ['vertical-stack', 'horizontal-stack'] as const) {
        for (const entity of buildPreset(opstelling, weergave, makeId).entities) {
          if (entity.type !== 'player' && entity.type !== 'cone') continue
          expect(entity.pos.x, `${opstelling}/${weergave}`).toBeGreaterThanOrEqual(0)
          expect(entity.pos.x, `${opstelling}/${weergave}`).toBeLessThanOrEqual(grenzen[weergave].maxX)
          expect(entity.pos.y).toBeGreaterThanOrEqual(0)
          expect(entity.pos.y).toBeLessThanOrEqual(37)
        }
      }
    }
  })

  it('zet de verdediger aan de endzonekant van zijn man', () => {
    const content = buildPreset('vertical-stack', 'volledig', makeId)
    const spelers = content.entities.filter(isPlayer)
    const aanval = spelers.filter((p) => p.side === 'offense')
    const verdediging = spelers.filter((p) => p.side === 'defense')
    // Volledig veld: de aanval loopt naar x = 100, dus de verdediger staat hoger.
    expect(verdediging[0]!.pos.x).toBeGreaterThan(aanval[0]!.pos.x)
  })

  it('geeft een leeg veld ook echt leeg terug', () => {
    expect(buildPreset('leeg', 'volledig', makeId).entities).toHaveLength(0)
  })
})
