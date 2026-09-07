import { describe, expect, it } from 'vitest'
import { leesFrameContent } from './migratie'

const speler = {
  id: 'p1',
  type: 'player',
  z: 0,
  pos: { x: 10, y: 10 },
  side: 'offense',
  role: 'cutter',
  color: 'standaard',
  hasDisc: false,
}

const juke = {
  id: 'a1',
  type: 'arrow',
  z: 1,
  kind: 'juke',
  ownerId: 'p1',
  path: { points: [{ x: 10, y: 10 }, { x: 20, y: 14 }] },
}

describe('een frame van voor versie 2 lezen', () => {
  it('maakt van een juke een curve en laat het pad staan', () => {
    const content = leesFrameContent({ entities: [speler, juke] }, 1)
    const arrow = content.entities[1]!
    expect(arrow.type === 'arrow' && arrow.kind).toBe('curve')
    expect(arrow.type === 'arrow' && arrow.path.points).toEqual(juke.path.points)
  })

  it('laat een frame van versie 2 met rust', () => {
    const curve = { ...juke, kind: 'curve' }
    const content = leesFrameContent({ entities: [speler, curve] }, 2)
    expect(content.entities).toHaveLength(2)
  })

  it('weigert nog altijd onzin, ook uit een oud frame', () => {
    expect(() => leesFrameContent({ entities: [speler, { ...juke, kind: 'salto' }] }, 1)).toThrow()
  })
})
