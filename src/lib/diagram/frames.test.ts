import { describe, expect, it } from 'vitest'
import { createArrow } from './arrows'
import { createCone, createPlayer } from './entities'
import { bewegingsArrows, kanFrameToevoegen, MAX_FRAMES, volgendFrame } from './frames'
import { frameContentSchema, isPlayer, type Entity, type FrameContent } from './schema'

let teller = 0
const id = () => `e${++teller}`

function opstelling(): FrameContent {
  const werper = {
    ...createPlayer({ id: 'p1', pos: { x: 30, y: 18 }, side: 'offense', entities: [] }),
    hasDisc: true,
  }
  const cutter = createPlayer({ id: 'p2', pos: { x: 45, y: 22 }, side: 'offense', entities: [werper] })
  const verdediger = createPlayer({
    id: 'd1',
    pos: { x: 47, y: 22 },
    side: 'defense',
    entities: [werper, cutter],
  })
  const pion = createCone({ id: 'c1', pos: { x: 30, y: 2 }, entities: [] })
  return { entities: [werper, cutter, verdediger, pion] }
}

const cut = (ownerId: string, van: { x: number; y: number }, naar: { x: number; y: number }) => {
  const arrow = createArrow({ id: id(), ownerId, van, kind: 'cut', weergave: 'volledig', entities: [] })
  arrow.path.points = [van, naar]
  return arrow
}

describe('bewegingsarrows', () => {
  it('telt cuts en jukes, geen worpen', () => {
    const content = opstelling()
    content.entities.push(cut('p2', { x: 45, y: 22 }, { x: 60, y: 30 }))
    content.entities.push(
      createArrow({
        id: id(),
        ownerId: 'p1',
        van: { x: 30, y: 18 },
        kind: 'throw',
        weergave: 'volledig',
        entities: [],
      }),
    )
    expect(bewegingsArrows(content)).toHaveLength(1)
  })
})

describe('frame toevoegen mag', () => {
  it('niet zonder bewegingsarrow', () => {
    expect(kanFrameToevoegen(opstelling(), 1)).toBe(false)
  })

  it('wel zodra er een cut staat', () => {
    const content = opstelling()
    content.entities.push(cut('p2', { x: 45, y: 22 }, { x: 60, y: 30 }))
    expect(kanFrameToevoegen(content, 1)).toBe(true)
  })

  it('niet voorbij tien frames', () => {
    const content = opstelling()
    content.entities.push(cut('p2', { x: 45, y: 22 }, { x: 60, y: 30 }))
    expect(kanFrameToevoegen(content, MAX_FRAMES)).toBe(false)
  })
})

describe('volgendFrame', () => {
  it('zet de speler op het eindpunt van zijn cut en haalt die cut weg', () => {
    const content = opstelling()
    content.entities.push(cut('p2', { x: 45, y: 22 }, { x: 60, y: 30 }))

    const volgend = volgendFrame(content)
    const cutter = volgend.entities.find((e) => e.id === 'p2')
    expect(isPlayer(cutter!) && cutter.pos).toEqual({ x: 60, y: 30 })
    expect(volgend.entities.filter((e) => e.type === 'arrow')).toHaveLength(0)
  })

  it('laat iedereen zonder arrow gewoon staan', () => {
    const content = opstelling()
    content.entities.push(cut('p2', { x: 45, y: 22 }, { x: 60, y: 30 }))

    const volgend = volgendFrame(content)
    const verdediger = volgend.entities.find((e) => e.id === 'd1')
    expect(isPlayer(verdediger!) && verdediger.pos).toEqual({ x: 47, y: 22 })
    expect(volgend.entities.find((e) => e.id === 'c1')).toBeDefined()
  })

  it('houdt de ids gelijk, want daar hangt de animatie aan', () => {
    const content = opstelling()
    content.entities.push(cut('p2', { x: 45, y: 22 }, { x: 60, y: 30 }))
    const volgend = volgendFrame(content)
    expect(volgend.entities.map((e) => e.id).sort()).toEqual(['c1', 'd1', 'p1', 'p2'])
  })

  it('raakt het oorspronkelijke frame niet aan', () => {
    const content = opstelling()
    content.entities.push(cut('p2', { x: 45, y: 22 }, { x: 60, y: 30 }))
    volgendFrame(content)
    const cutter = content.entities.find((e) => e.id === 'p2')
    expect(isPlayer(cutter!) && cutter.pos).toEqual({ x: 45, y: 22 })
    expect(content.entities.filter((e) => e.type === 'arrow')).toHaveLength(1)
  })

  it('verplaatst ook via een juke', () => {
    const content = opstelling()
    const juke = cut('p2', { x: 45, y: 22 }, { x: 55, y: 12 })
    juke.kind = 'juke'
    content.entities.push(juke)
    const volgend = volgendFrame(content)
    const cutter = volgend.entities.find((e) => e.id === 'p2')
    expect(isPlayer(cutter!) && cutter.pos).toEqual({ x: 55, y: 12 })
  })

  it('geeft de schijf door bij een worp met ontvanger', () => {
    const content = opstelling()
    const worp = createArrow({
      id: id(),
      ownerId: 'p1',
      van: { x: 30, y: 18 },
      kind: 'throw',
      weergave: 'volledig',
      entities: [],
      throwType: 'backhand',
    })
    worp.targetId = 'p2'
    content.entities.push(worp)

    const volgend = volgendFrame(content)
    const werper = volgend.entities.find((e) => e.id === 'p1')
    const ontvanger = volgend.entities.find((e) => e.id === 'p2')
    expect(isPlayer(werper!) && werper.hasDisc).toBe(false)
    expect(isPlayer(ontvanger!) && ontvanger.hasDisc).toBe(true)
    expect(volgend.entities.filter((e) => e.type === 'arrow')).toHaveLength(0)
  })

  it('laat een worp zonder ontvanger staan, want die is nog nergens aangekomen', () => {
    const content = opstelling()
    content.entities.push(
      createArrow({
        id: id(),
        ownerId: 'p1',
        van: { x: 30, y: 18 },
        kind: 'throw',
        weergave: 'volledig',
        entities: [],
      }),
    )
    const volgend = volgendFrame(content)
    expect(volgend.entities.filter((e) => e.type === 'arrow')).toHaveLength(1)
  })

  it('neemt een overblijvende arrow mee met de speler die verhuist', () => {
    const content = opstelling()
    content.entities.push(cut('p2', { x: 45, y: 22 }, { x: 60, y: 30 }))
    const worp = createArrow({
      id: 'a-worp',
      ownerId: 'p2',
      van: { x: 45, y: 22 },
      kind: 'throw',
      weergave: 'volledig',
      entities: [],
    })
    content.entities.push(worp)

    const volgend = volgendFrame(content)
    const meegereisd = volgend.entities.find((e) => e.id === 'a-worp')
    expect(meegereisd?.type).toBe('arrow')
    if (meegereisd?.type === 'arrow') {
      expect(meegereisd.path.points[0]).toEqual({ x: 60, y: 30 })
    }
  })

  it('levert een frame op dat door het schema komt', () => {
    const content = opstelling()
    content.entities.push(cut('p2', { x: 45, y: 22 }, { x: 60, y: 30 }))
    const worp = createArrow({
      id: id(),
      ownerId: 'p1',
      van: { x: 30, y: 18 },
      kind: 'throw',
      weergave: 'volledig',
      entities: [],
    })
    worp.targetId = 'p2'
    content.entities.push(worp)

    const volgend = volgendFrame(content)
    expect(frameContentSchema.safeParse(volgend).success).toBe(true)
  })

  it('houdt hoogstens één schijfdrager over', () => {
    const content = opstelling()
    const worp = createArrow({
      id: id(),
      ownerId: 'p1',
      van: { x: 30, y: 18 },
      kind: 'throw',
      weergave: 'volledig',
      entities: [],
    })
    worp.targetId = 'p2'
    content.entities.push(worp)

    const volgend = volgendFrame(content)
    const dragers = volgend.entities.filter((e: Entity) => isPlayer(e) && e.hasDisc)
    expect(dragers).toHaveLength(1)
  })
})

describe('een worp telt ook als beweging', () => {
  it('laat een volgend frame toe bij een worp met ontvanger', () => {
    const werper = createPlayer({ id: 'p1', pos: { x: 30, y: 18 }, side: 'offense', entities: [] })
    werper.hasDisc = true
    const ontvanger = createPlayer({ id: 'p2', pos: { x: 50, y: 18 }, side: 'offense', entities: [] })
    const worp = createArrow({
      id: 'a1',
      ownerId: 'p1',
      van: { x: 30, y: 18 },
      kind: 'throw',
      weergave: 'volledig',
      entities: [werper, ontvanger],
    })

    const content: FrameContent = { entities: [werper, ontvanger, worp] }
    expect(worp.targetId).toBe('p2')
    expect(kanFrameToevoegen(content, 1)).toBe(true)

    const volgend = volgendFrame(content)
    const nieuweDrager = volgend.entities.find((e) => e.type === 'player' && e.hasDisc)
    expect(nieuweDrager?.id).toBe('p2')
  })

  it('laat geen volgend frame toe bij een worp zonder ontvanger', () => {
    const werper = createPlayer({ id: 'p1', pos: { x: 30, y: 18 }, side: 'offense', entities: [] })
    werper.hasDisc = true
    const worp = createArrow({
      id: 'a1',
      ownerId: 'p1',
      van: { x: 30, y: 18 },
      kind: 'throw',
      weergave: 'volledig',
      entities: [werper],
    })
    expect(worp.targetId).toBeUndefined()
    expect(kanFrameToevoegen({ entities: [werper, worp] }, 1)).toBe(false)
  })
})
