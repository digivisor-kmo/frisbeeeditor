import { describe, expect, it } from 'vitest'
import { createArrow } from './arrows'
import { distance } from './curve'
import { createPlayer } from './entities'
import { volgendFrame } from './frames'
import {
  dekkingOpTijd,
  easeInOut,
  frameOpTijd,
  positieOpTijd,
  schijfDragerOpTijd,
  schijfOpTijd,
  totaleDuur,
  worpEase,
  WORP_AANKOMST,
  WORP_START,
} from './animation'
import type { FrameContent } from './schema'

const speler = (id: string, x: number, y: number, over: Partial<{ hasDisc: boolean }> = {}) => ({
  ...createPlayer({ id, pos: { x, y }, side: 'offense' as const, entities: [] }),
  ...over,
})

function metCut(punten: { x: number; y: number }[]): { vorig: FrameContent; volgend: FrameContent } {
  const p = speler('p1', punten[0]!.x, punten[0]!.y)
  const arrow = createArrow({
    id: 'a1',
    ownerId: 'p1',
    van: punten[0]!,
    kind: 'cut',
    weergave: 'volledig',
    entities: [],
  })
  arrow.path.points = punten
  const vorig: FrameContent = { entities: [p, arrow] }
  return { vorig, volgend: volgendFrame(vorig) }
}

describe('easeInOut', () => {
  it('begint en eindigt op nul en één', () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(1)).toBe(1)
  })

  it('staat halverwege in het midden', () => {
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 6)
  })

  it('klemt buiten bereik', () => {
    expect(easeInOut(-3)).toBe(0)
    expect(easeInOut(4)).toBe(1)
  })
})

describe('positie tussen twee frames', () => {
  it('staat bij t nul en t één precies op de framestanden', () => {
    const { vorig, volgend } = metCut([
      { x: 20, y: 10 },
      { x: 40, y: 10 },
    ])
    expect(positieOpTijd(vorig, volgend, 'p1', 0)).toEqual({ x: 20, y: 10 })
    const eind = positieOpTijd(vorig, volgend, 'p1', 1)!
    expect(eind.x).toBeCloseTo(40, 6)
    expect(eind.y).toBeCloseTo(10, 6)
  })

  it('loopt zonder arrow in een rechte lijn', () => {
    const vorig: FrameContent = { entities: [speler('p1', 10, 10)] }
    const volgend: FrameContent = { entities: [speler('p1', 30, 20)] }
    const half = positieOpTijd(vorig, volgend, 'p1', 0.5)!
    expect(half.x).toBeCloseTo(20, 6)
    expect(half.y).toBeCloseTo(15, 6)
  })

  it('volgt het pad van de cut in plaats van de rechte lijn ernaartoe', () => {
    const { vorig, volgend } = metCut([
      { x: 20, y: 10 },
      { x: 30, y: 22 },
      { x: 40, y: 10 },
    ])
    const half = positieOpTijd(vorig, volgend, 'p1', 0.5)!
    // De rechte lijn zou hier y = 10 geven; het pad buigt naar boven.
    expect(half.y).toBeGreaterThan(14)
  })

  it('houdt de snelheid gelijk in de bocht', () => {
    // Zonder booglengte zou de speler in de bocht zichtbaar versnellen.
    const { vorig, volgend } = metCut([
      { x: 0, y: 0 },
      { x: 10, y: 14 },
      { x: 30, y: 0 },
    ])
    const stappen = 12
    const afstanden: number[] = []
    let vorigePunt = positieOpTijd(vorig, volgend, 'p1', 0)!
    for (let i = 1; i <= stappen; i++) {
      // Zonder de versoepeling, anders meet je die in plaats van de bocht.
      const t = i / stappen
      const punt = positieOpTijd(vorig, volgend, 'p1', t)!
      afstanden.push(distance(vorigePunt, punt))
      vorigePunt = punt
    }
    // Met ease-in-out horen de stappen aan de uiteinden kleiner te zijn dan in
    // het midden, en dat verloop hoort vloeiend te zijn, niet grillig.
    const midden = afstanden[Math.floor(stappen / 2)]!
    expect(midden).toBeGreaterThan(afstanden[0]!)
    expect(midden).toBeGreaterThan(afstanden[stappen - 1]!)
  })

  it('laat een juke aan begin en eind precies op de lijn vertrekken en aankomen', () => {
    const { vorig, volgend } = metCut([
      { x: 20, y: 10 },
      { x: 40, y: 10 },
    ])
    const arrow = vorig.entities.find((e) => e.type === 'arrow')!
    if (arrow.type === 'arrow') arrow.kind = 'juke'

    expect(positieOpTijd(vorig, volgend, 'p1', 0)!.y).toBeCloseTo(10, 6)
    expect(positieOpTijd(vorig, volgend, 'p1', 1)!.y).toBeCloseTo(10, 6)
    // Ergens onderweg wijkt hij wel af.
    const afwijkingen = [0.15, 0.3, 0.45, 0.6, 0.75].map(
      (t) => Math.abs(positieOpTijd(vorig, volgend, 'p1', t)!.y - 10),
    )
    expect(Math.max(...afwijkingen)).toBeGreaterThan(0.2)
  })

  it('geeft null voor iemand die in geen van beide frames staat', () => {
    const leeg: FrameContent = { entities: [] }
    expect(positieOpTijd(leeg, leeg, 'p9', 0.5)).toBeNull()
  })
})

describe('faden', () => {
  const vorig: FrameContent = { entities: [speler('p1', 10, 10)] }
  const volgend: FrameContent = { entities: [speler('p1', 10, 10), speler('p2', 20, 20)] }

  it('houdt wie in beide frames staat volledig zichtbaar', () => {
    expect(dekkingOpTijd(vorig, volgend, 'p1', 0.4, 1500)).toBe(1)
  })

  it('laat een nieuwkomer opkomen', () => {
    expect(dekkingOpTijd(vorig, volgend, 'p2', 0, 1500)).toBe(0)
    expect(dekkingOpTijd(vorig, volgend, 'p2', 1, 1500)).toBe(1)
  })

  it('laat wie verdwijnt uitdoven', () => {
    expect(dekkingOpTijd(volgend, vorig, 'p2', 0, 1500)).toBe(1)
    expect(dekkingOpTijd(volgend, vorig, 'p2', 1, 1500)).toBe(0)
  })
})

describe('de schijf', () => {
  function metWorp(): FrameContent {
    const werper = speler('p1', 20, 18, { hasDisc: true })
    const ontvanger = speler('p2', 50, 18)
    const worp = createArrow({
      id: 'a1',
      ownerId: 'p1',
      van: { x: 20, y: 18 },
      kind: 'throw',
      weergave: 'volledig',
      entities: [],
      throwType: 'backhand',
    })
    worp.path.points = [
      { x: 20, y: 18 },
      { x: 50, y: 18 },
    ]
    worp.targetId = 'p2'
    return { entities: [werper, ontvanger, worp] }
  }

  /** The frame after the throw: the receiver has it, the arrow is spent. */
  function naWorp(): FrameContent {
    return {
      entities: [speler('p1', 20, 18), speler('p2', 50, 18, { hasDisc: true })],
    }
  }

  it('vertrekt pas als de ontvanger al onderweg is', () => {
    expect(schijfOpTijd(metWorp(), naWorp(), WORP_START - 0.05)).toBeNull()
  })

  it('is halverwege de vlucht ergens op het pad', () => {
    const onderweg = schijfOpTijd(metWorp(), naWorp(), (WORP_START + WORP_AANKOMST) / 2)!
    expect(onderweg.point.x).toBeGreaterThan(20)
    expect(onderweg.point.x).toBeLessThan(50)
    expect(onderweg.vanId).toBe('p1')
  })

  it('is na aankomst niet meer in de lucht', () => {
    expect(schijfOpTijd(metWorp(), naWorp(), WORP_AANKOMST + 0.05)).toBeNull()
  })

  it('ligt voor de aankomst nog bij de werper en daarna bij de ontvanger', () => {
    expect(schijfDragerOpTijd(metWorp(), 0.5)).toBe('p1')
    expect(schijfDragerOpTijd(metWorp(), 0.95)).toBe('p2')
  })

  it('doet niets als er geen worp met ontvanger is', () => {
    const zonder: FrameContent = { entities: [speler('p1', 10, 10, { hasDisc: true })] }
    expect(schijfOpTijd(zonder, zonder, 0.5)).toBeNull()
    expect(schijfDragerOpTijd(zonder, 0.5)).toBeNull()
  })

  it('vliegt niet uit een hand die de schijf niet heeft', () => {
    const content = metWorp()
    for (const entity of content.entities) {
      if (entity.type === 'player') entity.hasDisc = false
    }
    expect(schijfOpTijd(content, naWorp(), 0.5)).toBeNull()
    expect(schijfDragerOpTijd(content, 0.5)).toBeNull()
  })

  it('komt aan in de handen van een ontvanger die zelf beweegt', () => {
    // The receiver cuts from where the throw was aimed to ten metres further.
    const vorig = metWorp()
    const cut = createArrow({
      id: 'a2',
      ownerId: 'p2',
      van: { x: 50, y: 18 },
      kind: 'cut',
      weergave: 'volledig',
      entities: [],
    })
    cut.path.points = [
      { x: 50, y: 18 },
      { x: 60, y: 18 },
    ]
    vorig.entities.push(cut)

    const volgend: FrameContent = {
      entities: [speler('p1', 20, 18), speler('p2', 60, 18, { hasDisc: true })],
    }

    const bijAankomst = schijfOpTijd(vorig, volgend, WORP_AANKOMST)!
    const ontvanger = positieOpTijd(vorig, volgend, 'p2', WORP_AANKOMST)!
    expect(bijAankomst.point.x).toBeCloseTo(ontvanger.x, 6)
    expect(bijAankomst.point.y).toBeCloseTo(ontvanger.y, 6)
  })

  it('vertrekt sneller dan hij aankomt', () => {
    // A disc leaves the hand at speed; only a carried object eases in.
    expect(worpEase(0)).toBe(0)
    expect(worpEase(1)).toBe(1)
    expect(worpEase(0.5)).toBeGreaterThan(0.6)

    const halverwege = (WORP_START + WORP_AANKOMST) / 2
    const punt = schijfOpTijd(metWorp(), naWorp(), halverwege)!
    // Halfway through the flight it is already past the middle of the throw.
    expect(punt.point.x).toBeGreaterThan(35 + 2)
  })

  it('vertrekt uit de hand van een werper die zelf beweegt', () => {
    const vorig = metWorp()
    const cut = createArrow({
      id: 'a3',
      ownerId: 'p1',
      van: { x: 20, y: 18 },
      kind: 'cut',
      weergave: 'volledig',
      entities: [],
    })
    cut.path.points = [
      { x: 20, y: 18 },
      { x: 20, y: 28 },
    ]
    vorig.entities.push(cut)

    const volgend: FrameContent = {
      entities: [speler('p1', 20, 28), speler('p2', 50, 18, { hasDisc: true })],
    }

    const bijVertrek = schijfOpTijd(vorig, volgend, WORP_START)!
    const werper = positieOpTijd(vorig, volgend, 'p1', WORP_START)!
    expect(bijVertrek.point.x).toBeCloseTo(werper.x, 6)
    expect(bijVertrek.point.y).toBeCloseTo(werper.y, 6)
  })
})

describe('tijdlijn', () => {
  it('telt elk frame behalve het laatste, want dat loopt nergens naartoe', () => {
    expect(totaleDuur([1500, 1000, 2000])).toBe(2500)
    expect(totaleDuur([1500])).toBe(0)
  })

  it('vindt het juiste frame en de plek daarin', () => {
    const duren = [1000, 2000, 1500]
    expect(frameOpTijd(duren, 0)).toEqual({ index: 0, t: 0 })
    expect(frameOpTijd(duren, 500)).toEqual({ index: 0, t: 0.5 })
    expect(frameOpTijd(duren, 1000)).toEqual({ index: 1, t: 0 })
    expect(frameOpTijd(duren, 2000)).toEqual({ index: 1, t: 0.5 })
  })

  it('blijft op het einde staan in plaats van door te lopen', () => {
    expect(frameOpTijd([1000, 2000, 1500], 99999)).toEqual({ index: 1, t: 1 })
  })

  it('heeft bij één frame niets te animeren', () => {
    expect(frameOpTijd([1500], 400)).toEqual({ index: 0, t: 0 })
  })
})
