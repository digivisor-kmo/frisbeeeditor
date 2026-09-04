import { describe, expect, it } from 'vitest'
import { createArrow } from './arrows'
import { createCone, createPlayer } from './entities'
import { volgendFrame } from './frames'
import {
  arrowVerplaatsing,
  bewegingsArrowVan,
  herberekenSchijfVanaf,
  synchroniseerArrowMetVorigFrame,
  verplaatsVanaf,
  verwijderVanaf,
  voegToeVanaf,
  zetIdentiteit,
} from './propagatie'
import { isPlayer, type FrameContent, type Player } from './schema'

const speler = (id: string, x: number, y: number, over: Partial<Player> = {}): Player => ({
  ...createPlayer({ id, pos: { x, y }, side: 'offense', entities: [] }),
  ...over,
})

const cut = (id: string, ownerId: string, van: { x: number; y: number }, naar: { x: number; y: number }) => {
  const arrow = createArrow({ id, ownerId, van, kind: 'cut', weergave: 'volledig', entities: [] })
  arrow.path.points = [{ ...van }, { ...naar }]
  return arrow
}

/** Drie frames: p1 loopt in frame 1 van 20,10 naar 40,10 en blijft daarna staan. */
function keten(): FrameContent[] {
  const frame1: FrameContent = {
    entities: [speler('p1', 20, 10), speler('p2', 60, 30), cut('a1', 'p1', { x: 20, y: 10 }, { x: 40, y: 10 })],
  }
  const frame2 = volgendFrame(frame1)
  const frame3 = volgendFrame(frame2)
  return [frame1, frame2, frame3]
}

const posVan = (content: FrameContent, id: string) => {
  const entity = content.entities.find((e) => e.id === id)
  return entity && isPlayer(entity) ? entity.pos : null
}

describe('de keten die de tests gebruiken', () => {
  it('zet de speler in frame 2 op het eindpunt van zijn cut', () => {
    const frames = keten()
    expect(posVan(frames[1]!, 'p1')).toEqual({ x: 40, y: 10 })
    expect(posVan(frames[2]!, 'p1')).toEqual({ x: 40, y: 10 })
  })
})

describe('verplaatsen werkt vooruit door', () => {
  it('schuift dezelfde speler in alle volgende frames mee', () => {
    const frames = keten()
    const geraakt = verplaatsVanaf(frames, 0, 'p1', { x: 0, y: 5 })

    expect(posVan(frames[0]!, 'p1')).toEqual({ x: 20, y: 15 })
    expect(posVan(frames[1]!, 'p1')).toEqual({ x: 40, y: 15 })
    expect(posVan(frames[2]!, 'p1')).toEqual({ x: 40, y: 15 })
    expect(geraakt).toBe(2)
  })

  it('laat eerdere frames met rust', () => {
    const frames = keten()
    verplaatsVanaf(frames, 1, 'p1', { x: 3, y: 0 })
    expect(posVan(frames[0]!, 'p1')).toEqual({ x: 20, y: 10 })
    expect(posVan(frames[1]!, 'p1')).toEqual({ x: 43, y: 10 })
    expect(posVan(frames[2]!, 'p1')).toEqual({ x: 43, y: 10 })
  })

  it('neemt de arrow van die speler mee', () => {
    const frames = keten()
    verplaatsVanaf(frames, 0, 'p1', { x: 0, y: 5 })
    const arrow = bewegingsArrowVan(frames[0]!, 'p1')!
    expect(arrow.path.points[0]).toEqual({ x: 20, y: 15 })
    expect(arrow.path.points[1]).toEqual({ x: 40, y: 15 })
  })

  it('raakt niemand anders aan', () => {
    const frames = keten()
    verplaatsVanaf(frames, 0, 'p1', { x: 0, y: 5 })
    expect(posVan(frames[2]!, 'p2')).toEqual({ x: 60, y: 30 })
  })

  it('doet niets bij een verplaatsing van nul', () => {
    const frames = keten()
    expect(verplaatsVanaf(frames, 0, 'p1', { x: 0, y: 0 })).toBe(0)
  })
})

describe('de invariant tussen arrow en volgend frame', () => {
  it('sleept de punt van de cut mee als je de speler in het volgende frame verzet', () => {
    const frames = keten()
    const delta = { x: 6, y: -4 }

    synchroniseerArrowMetVorigFrame(frames, 1, 'p1', delta)
    verplaatsVanaf(frames, 1, 'p1', delta)

    const arrow = bewegingsArrowVan(frames[0]!, 'p1')!
    // De punt van de cut en de positie in frame 2 zijn hetzelfde punt.
    expect(arrow.path.points[1]).toEqual({ x: 46, y: 6 })
    expect(posVan(frames[1]!, 'p1')).toEqual({ x: 46, y: 6 })
  })

  it('laat het beginpunt van de cut staan', () => {
    const frames = keten()
    synchroniseerArrowMetVorigFrame(frames, 1, 'p1', { x: 6, y: -4 })
    expect(bewegingsArrowVan(frames[0]!, 'p1')!.path.points[0]).toEqual({ x: 20, y: 10 })
  })

  it('doet niets in het eerste frame, want daarvoor ligt niets', () => {
    const frames = keten()
    synchroniseerArrowMetVorigFrame(frames, 0, 'p1', { x: 5, y: 5 })
    expect(bewegingsArrowVan(frames[0]!, 'p1')!.path.points[1]).toEqual({ x: 40, y: 10 })
  })

  it('doet niets voor een speler zonder arrow in het vorige frame', () => {
    const frames = keten()
    synchroniseerArrowMetVorigFrame(frames, 1, 'p2', { x: 5, y: 5 })
    expect(posVan(frames[0]!, 'p2')).toEqual({ x: 60, y: 30 })
  })
})

describe('arrowVerplaatsing', () => {
  it('geeft de afstand die de arrow zijn eigenaar laat afleggen', () => {
    const frames = keten()
    const arrow = bewegingsArrowVan(frames[0]!, 'p1')!
    expect(arrowVerplaatsing(frames[0]!, arrow)).toEqual({ x: 20, y: 0 })
  })

  it('geeft niets terug voor een worp, want die verplaatst niemand', () => {
    const worp = createArrow({
      id: 'w1',
      ownerId: 'p1',
      van: { x: 20, y: 10 },
      kind: 'throw',
      weergave: 'volledig',
      entities: [],
    })
    const content: FrameContent = { entities: [speler('p1', 20, 10), worp] }
    expect(arrowVerplaatsing(content, worp)).toBeNull()
  })
})

describe('toevoegen en verwijderen', () => {
  it('zet een nieuwe entiteit ook in alle volgende frames', () => {
    const frames = keten()
    const pion = createCone({ id: 'c1', pos: { x: 5, y: 5 }, entities: [] })
    const geraakt = voegToeVanaf(frames, 0, pion)

    expect(geraakt).toBe(2)
    for (const content of frames) {
      expect(content.entities.some((e) => e.id === 'c1')).toBe(true)
    }
  })

  it('zet hem niet in eerdere frames', () => {
    const frames = keten()
    voegToeVanaf(frames, 1, createCone({ id: 'c1', pos: { x: 5, y: 5 }, entities: [] }))
    expect(frames[0]!.entities.some((e) => e.id === 'c1')).toBe(false)
    expect(frames[2]!.entities.some((e) => e.id === 'c1')).toBe(true)
  })

  it('verwijdert vanaf hier en laat eerdere frames intact', () => {
    const frames = keten()
    verwijderVanaf(frames, 1, new Set(['p2']))
    expect(frames[0]!.entities.some((e) => e.id === 'p2')).toBe(true)
    expect(frames[1]!.entities.some((e) => e.id === 'p2')).toBe(false)
    expect(frames[2]!.entities.some((e) => e.id === 'p2')).toBe(false)
  })

  it('neemt de arrows van wie verdwijnt mee', () => {
    const frames = keten()
    verwijderVanaf(frames, 0, new Set(['p1']))
    expect(frames[0]!.entities.some((e) => e.id === 'a1')).toBe(false)
  })
})

describe('identiteit geldt voor het hele diagram', () => {
  it('verandert de kant in elk frame, ook de frames ervoor', () => {
    const frames = keten()
    zetIdentiteit(frames, 'p1', { side: 'defense', role: 'mark' })

    for (const content of frames) {
      const entity = content.entities.find((e) => e.id === 'p1')!
      expect(isPlayer(entity) && entity.side).toBe('defense')
      expect(isPlayer(entity) && entity.role).toBe('mark')
    }
  })

  it('verandert een kleur overal', () => {
    const frames = keten()
    zetIdentiteit(frames, 'p2', { color: 'geel' })
    for (const content of frames) {
      const entity = content.entities.find((e) => e.id === 'p2')!
      expect(isPlayer(entity) && entity.color).toBe('geel')
    }
  })

  it('kan een eigen label weer weghalen', () => {
    const frames = keten()
    zetIdentiteit(frames, 'p1', { label: 'X' })
    zetIdentiteit(frames, 'p1', { label: undefined })
    const entity = frames[2]!.entities.find((e) => e.id === 'p1')!
    expect(isPlayer(entity) && entity.label).toBeUndefined()
  })
})

describe('de schijf loopt vooruit mee', () => {
  function metWorp(): FrameContent[] {
    const worp = createArrow({
      id: 'w1',
      ownerId: 'p1',
      van: { x: 20, y: 10 },
      kind: 'throw',
      weergave: 'volledig',
      entities: [],
    })
    worp.targetId = 'p2'
    const frame1: FrameContent = {
      entities: [speler('p1', 20, 10, { hasDisc: true }), speler('p2', 60, 30), worp],
    }
    const frame2 = volgendFrame(frame1)
    const frame3 = volgendFrame(frame2)
    return [frame1, frame2, frame3]
  }

  it('geeft de schijf door vanaf het frame na de worp', () => {
    const frames = metWorp()
    herberekenSchijfVanaf(frames, 0)
    const drager = (content: FrameContent) =>
      content.entities.filter(isPlayer).find((p) => p.hasDisc)?.id
    expect(drager(frames[0]!)).toBe('p1')
    expect(drager(frames[1]!)).toBe('p2')
    expect(drager(frames[2]!)).toBe('p2')
  })

  it('houdt overal hoogstens één schijfdrager over', () => {
    const frames = metWorp()
    herberekenSchijfVanaf(frames, 0)
    for (const content of frames) {
      expect(content.entities.filter(isPlayer).filter((p) => p.hasDisc)).toHaveLength(1)
    }
  })

  it('volgt een nieuwe ontvanger als je de worp omlegt', () => {
    const frames = metWorp()
    const worp = frames[0]!.entities.find((e) => e.id === 'w1')!
    if (worp.type === 'arrow') worp.targetId = 'p1'
    herberekenSchijfVanaf(frames, 0)
    const drager = frames[1]!.entities.filter(isPlayer).find((p) => p.hasDisc)?.id
    expect(drager).toBe('p1')
  })
})
