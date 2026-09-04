import { describe, expect, it } from 'vitest'
import {
  buildLengthTable,
  distance,
  evalBezier,
  midpoint,
  pointAtDistance,
  pointAtFraction,
  tangentAt,
  toBezier,
  toPathD,
  trimStart,
} from './curve'

const recht = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
]

const bocht = [
  { x: 0, y: 0 },
  { x: 5, y: 6 },
  { x: 10, y: 0 },
]

/** Bewust scheef: het eerste segment is veel korter dan het tweede. */
const scheef = [
  { x: 0, y: 0 },
  { x: 2, y: 4 },
  { x: 14, y: 1 },
]

describe('toBezier', () => {
  it('geeft niets terug voor minder dan twee punten', () => {
    expect(toBezier([])).toEqual([])
    expect(toBezier([{ x: 1, y: 1 }])).toEqual([])
  })

  it('maakt één segment per interval', () => {
    expect(toBezier(recht)).toHaveLength(1)
    expect(toBezier(bocht)).toHaveLength(2)
  })

  it('houdt een rechte lijn recht', () => {
    const [seg] = toBezier(recht)
    expect(seg!.c1.x).toBeCloseTo(10 / 3, 9)
    expect(seg!.c2.x).toBeCloseTo(20 / 3, 9)
    for (const t of [0.25, 0.5, 0.75]) {
      expect(evalBezier(seg!, t).y).toBeCloseTo(0, 10)
      // Een rechte lijn moet ook op constante snelheid doorlopen worden.
      expect(evalBezier(seg!, t).x).toBeCloseTo(10 * t, 9)
    }
  })

  it('loopt exact door elk opgegeven punt', () => {
    const segments = toBezier(bocht)
    expect(evalBezier(segments[0]!, 0)).toEqual(bocht[0])
    expect(evalBezier(segments[0]!, 1)).toEqual(bocht[1])
    expect(evalBezier(segments[1]!, 1)).toEqual(bocht[2])
  })

  it('is glad op de naad tussen twee segmenten', () => {
    const segments = toBezier(bocht)
    const voor = tangentAt(segments[0]!, 1)
    const na = tangentAt(segments[1]!, 0)
    expect(voor.x).toBeCloseTo(na.x, 9)
    expect(voor.y).toBeCloseTo(na.y, 9)
  })
})

describe('toPathD', () => {
  it('begint bij het eerste punt en heeft één C per segment', () => {
    const d = toPathD(bocht)
    expect(d.startsWith('M 0 0')).toBe(true)
    expect(d.split('C')).toHaveLength(3)
  })

  it('is leeg bij te weinig punten', () => {
    expect(toPathD([{ x: 1, y: 1 }])).toBe('')
  })
})

describe('booglengte', () => {
  it('meet een rechte lijn exact', () => {
    expect(buildLengthTable(recht).total).toBeCloseTo(10, 6)
  })

  it('is langer dan de koorde zodra er een bocht in zit', () => {
    const table = buildLengthTable(bocht)
    expect(table.total).toBeGreaterThan(distance(bocht[0]!, bocht[2]!))
  })

  it('loopt monotoon op', () => {
    const { cumulative } = buildLengthTable(bocht)
    for (let i = 1; i < cumulative.length; i++) {
      expect(cumulative[i]!).toBeGreaterThanOrEqual(cumulative[i - 1]!)
    }
  })

  it('geeft begin en einde exact terug', () => {
    const table = buildLengthTable(bocht)
    expect(pointAtDistance(table, 0).point.x).toBeCloseTo(0, 6)
    const eind = pointAtDistance(table, table.total).point
    expect(eind.x).toBeCloseTo(10, 6)
    expect(eind.y).toBeCloseTo(0, 6)
  })

  it('klemt buiten bereik in plaats van te ontsporen', () => {
    const table = buildLengthTable(bocht)
    expect(pointAtDistance(table, -50).point.x).toBeCloseTo(0, 6)
    expect(pointAtDistance(table, 9999).point.x).toBeCloseTo(10, 6)
  })
})

describe('parameterisatie op booglengte', () => {
  it('zet gelijke stappen ook echt op gelijke afstanden', () => {
    // Dit is de test die de klassieke fout vangt: stappen in t geeft in de
    // bochten zichtbaar andere afstanden dan stappen in booglengte.
    const table = buildLengthTable(bocht)
    const stappen = 20
    const afstanden: number[] = []
    let vorige = pointAtFraction(table, 0).point
    for (let i = 1; i <= stappen; i++) {
      const punt = pointAtFraction(table, i / stappen).point
      afstanden.push(distance(vorige, punt))
      vorige = punt
    }
    const verwacht = table.total / stappen
    for (const afstand of afstanden) {
      // Twee procent is de restfout van honderd samples per segment bij een
      // scherpe bocht. Onzichtbaar in een animatie.
      expect(Math.abs(afstand - verwacht) / verwacht).toBeLessThan(0.02)
    }

    // En het punt van de hele oefening: stappen in t is veel ongelijker.
    const segments = toBezier(bocht)
    const inT: number[] = []
    let vorigeT = evalBezier(segments[0]!, 0)
    for (let i = 1; i <= stappen; i++) {
      const f = i / stappen
      const index = f < 0.5 ? 0 : 1
      const punt = evalBezier(segments[index]!, (f - index * 0.5) * 2)
      inT.push(distance(vorigeT, punt))
      vorigeT = punt
    }
    const spreiding = (waarden: number[]) => Math.max(...waarden) - Math.min(...waarden)
    expect(spreiding(inT)).toBeGreaterThan(spreiding(afstanden) * 5)
  })

  it('verschilt aantoonbaar van stappen in t', () => {
    // Bij een symmetrische bocht vallen beide toevallig samen, dus dit moet met
    // een scheef pad: het eerste segment is daar veel korter dan het tweede.
    const halfInT = evalBezier(toBezier(scheef)[0]!, 1)
    const halfInLengte = pointAtFraction(buildLengthTable(scheef), 0.5).point
    expect(distance(halfInT, halfInLengte)).toBeGreaterThan(1)
  })

  it('geeft het midden van een rechte lijn gewoon in het midden', () => {
    const m = midpoint(recht)
    expect(m.x).toBeCloseTo(5, 4)
    expect(m.y).toBeCloseTo(0, 6)
  })
})

describe('trimStart', () => {
  it('schuift het beginpunt op over de gevraagde afstand', () => {
    const getrimd = trimStart(recht, 2)
    expect(getrimd[0]!.x).toBeCloseTo(2, 3)
    expect(getrimd[getrimd.length - 1]).toEqual({ x: 10, y: 0 })
  })

  it('laat het pad ongemoeid als er niets af kan', () => {
    expect(trimStart(recht, 0)).toEqual(recht)
    expect(trimStart(recht, 999)).toEqual(recht)
  })

  it('houdt het aantal punten gelijk', () => {
    expect(trimStart(bocht, 1)).toHaveLength(3)
  })
})
