import { describe, expect, it } from 'vitest'
import {
  buildPreset,
  CATEGORIE_VAN_OPSTELLING,
  OPSTELLINGEN,
  opstellingenVoor,
  opstellingPast,
} from './presets'
import { occupancy } from './entities'
import { frameContentSchema, isPlayer, SPEELVARIANT_CATEGORIEEN, type Weergave } from './schema'
import { FIELD_M } from '@/lib/field/geometry'

const WEERGAVEN: Weergave[] = ['volledig', 'half', 'vrij']

let teller = 0
const id = () => `p${teller++}`

describe('startopstellingen', () => {
  for (const opstelling of OPSTELLINGEN) {
    for (const weergave of WEERGAVEN) {
      if (!opstellingPast(opstelling, weergave)) continue

      describe(`${opstelling} op ${weergave}`, () => {
        const content = buildPreset(opstelling, weergave, id)

        it('komt door het schema', () => {
          expect(() => frameContentSchema.parse(content)).not.toThrow()
        })

        it('zet zeven tegen zeven neer, of niets', () => {
          const telling = occupancy(content.entities)
          if (opstelling === 'leeg') {
            expect(telling).toEqual({ offense: 0, defense: 0 })
          } else {
            expect(telling).toEqual({ offense: 7, defense: 7 })
          }
        })

        it('houdt iedereen binnen de lijnen', () => {
          for (const entity of content.entities) {
            if (!('pos' in entity)) continue
            expect(entity.pos.x).toBeGreaterThanOrEqual(0)
            expect(entity.pos.x).toBeLessThanOrEqual(FIELD_M.length)
            expect(entity.pos.y).toBeGreaterThanOrEqual(0)
            expect(entity.pos.y).toBeLessThanOrEqual(FIELD_M.width)
          }
        })

        it('geeft hoogstens één iemand de schijf', () => {
          const dragers = content.entities.filter((e) => isPlayer(e) && e.hasDisc)
          expect(dragers.length).toBeLessThanOrEqual(1)
        })
      })
    }
  }

  it('kent voor elke opstelling een bestaande categorie', () => {
    for (const opstelling of OPSTELLINGEN) {
      const categorie = CATEGORIE_VAN_OPSTELLING[opstelling]
      if (categorie === null) continue
      expect(SPEELVARIANT_CATEGORIEEN as readonly string[]).toContain(categorie)
    }
  })

  it('biedt op een half veld minder aan dan op een heel veld', () => {
    const heel = opstellingenVoor('volledig')
    const half = opstellingenVoor('half')
    expect(half.length).toBeLessThan(heel.length)
    // Wat er wel is, moet overal kunnen: anders sta je met een lege keuzelijst.
    expect(half).toContain('vertical-stack')
    expect(half).toContain('leeg')
  })
})
