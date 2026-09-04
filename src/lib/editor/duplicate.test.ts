import { describe, expect, it } from 'vitest'
import { createArrow } from '@/lib/diagram/arrows'
import { createCone, createPlayer } from '@/lib/diagram/entities'
import { frameContentSchema, isPlayer, type Entity } from '@/lib/diagram/schema'
import { dupliceer } from './duplicate'

let teller = 0
const makeId = () => `n${++teller}`

function opstelling(): Entity[] {
  const werper = { ...createPlayer({ id: 'p1', pos: { x: 30, y: 18 }, side: 'offense', entities: [] }), hasDisc: true }
  const ontvanger = createPlayer({ id: 'p2', pos: { x: 45, y: 22 }, side: 'offense', entities: [werper] })
  const pion = createCone({ id: 'c1', pos: { x: 30, y: 2 }, entities: [] })
  const cut = createArrow({
    id: 'a1',
    ownerId: 'p2',
    van: ontvanger.pos,
    kind: 'cut',
    weergave: 'volledig',
    entities: [],
  })
  const worp = createArrow({
    id: 'a2',
    ownerId: 'p1',
    van: werper.pos,
    kind: 'throw',
    weergave: 'volledig',
    entities: [],
    throwType: 'backhand',
  })
  return [werper, ontvanger, pion, cut, worp]
}

describe('dupliceren', () => {
  it('maakt evenveel kopieën als er geselecteerd is', () => {
    const entities = opstelling()
    const { kopieen } = dupliceer(entities, new Set(['p2', 'c1']), makeId)
    expect(kopieen).toHaveLength(2)
  })

  it('geeft elke kopie een nieuw id', () => {
    const entities = opstelling()
    const { kopieen } = dupliceer(entities, new Set(['p2']), makeId)
    expect(kopieen[0]!.id).not.toBe('p2')
  })

  it('legt de kopie naast het origineel in plaats van eroverheen', () => {
    const entities = opstelling()
    const { kopieen } = dupliceer(entities, new Set(['p2']), makeId)
    const kopie = kopieen[0]!
    if (kopie.type !== 'player') throw new Error('geen speler')
    expect(kopie.pos).toEqual({ x: 47, y: 24 })
  })

  it('geeft de kopie van de schijfdrager geen tweede schijf', () => {
    const entities = opstelling()
    const { kopieen } = dupliceer(entities, new Set(['p1']), makeId)
    const kopie = kopieen[0]!
    expect(isPlayer(kopie) && kopie.hasDisc).toBe(false)
  })

  it('hangt een gekopieerde cut aan de kopie van zijn speler', () => {
    const entities = opstelling()
    const { kopieen } = dupliceer(entities, new Set(['p2', 'a1']), makeId)
    const speler = kopieen.find((e) => e.type === 'player')!
    const cut = kopieen.find((e) => e.type === 'arrow')!
    if (cut.type !== 'arrow') throw new Error('geen arrow')
    expect(cut.ownerId).toBe(speler.id)
  })

  it('laat een gekopieerde worp bij de werper die de schijf echt heeft', () => {
    const entities = opstelling()
    const { kopieen } = dupliceer(entities, new Set(['p1', 'a2']), makeId)
    const worp = kopieen.find((e) => e.type === 'arrow')!
    if (worp.type !== 'arrow') throw new Error('geen arrow')
    expect(worp.ownerId).toBe('p1')
  })

  it('levert samen met het origineel een geldig frame op', () => {
    const entities = opstelling()
    for (const selectie of [['p1'], ['p1', 'a2'], ['p2', 'a1'], ['p1', 'p2', 'c1', 'a1', 'a2']]) {
      const { kopieen } = dupliceer(entities, new Set(selectie), makeId)
      const resultaat = frameContentSchema.safeParse({ entities: [...entities, ...kopieen] })
      expect(resultaat.success, selectie.join('+')).toBe(true)
    }
  })

  it('doet niets bij een lege selectie', () => {
    expect(dupliceer(opstelling(), new Set(), makeId).kopieen).toEqual([])
  })
})
