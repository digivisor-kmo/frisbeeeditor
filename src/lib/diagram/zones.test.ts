import { describe, expect, it } from 'vitest'
import { createZone, inZone, MIN_ZONE_M, zoneKader, zoneMidden } from './zones'
import { verwijderSelectie } from './propagatie'
import { createPlayer } from './entities'
import type { FrameContent } from './schema'

const zone = () =>
  createZone({
    id: 'z1',
    shape: 'rect',
    van: { x: 40, y: 20 },
    tot: { x: 20, y: 5 },
    entities: [],
  })

describe('een zone', () => {
  it('leest zijn kader ongeacht de volgorde waarin je hem tekende', () => {
    expect(zoneKader(zone())).toEqual({ minX: 20, minY: 5, maxX: 40, maxY: 20 })
    expect(zoneMidden(zone())).toEqual({ x: 30, y: 12.5 })
  })

  it('ligt een punt in een rechthoek zodra het in het kader ligt', () => {
    expect(inZone(zone(), { x: 21, y: 6 })).toBe(true)
    expect(inZone(zone(), { x: 19, y: 6 })).toBe(false)
  })

  it('gebruikt bij een ellips de vorm en niet het kader', () => {
    const ellips = { ...zone(), shape: 'ellipse' as const }
    // Het midden ligt erin, de hoek van het kader er net buiten.
    expect(inZone(ellips, { x: 30, y: 12.5 })).toBe(true)
    expect(inZone(ellips, { x: 20.2, y: 5.2 })).toBe(false)
  })

  it('krijgt een streepjesrand en een doorschijnende vulling', () => {
    const z = zone()
    expect(z.style.dash).toBe(true)
    expect(z.style.opacity).toBeLessThan(0.3)
    expect(z.style.fill).toBe(z.style.stroke)
  })

  it('houdt een ondergrens die groter is dan nul', () => {
    expect(MIN_ZONE_M).toBeGreaterThan(0)
  })
})

describe('verwijderen in een diagram met meerdere frames', () => {
  const frames = (): FrameContent[] => {
    const speler = createPlayer({
      id: 'p1',
      pos: { x: 10, y: 10 },
      side: 'offense',
      entities: [],
    })
    const maak = (): FrameContent => ({
      entities: [
        JSON.parse(JSON.stringify(speler)) as typeof speler,
        JSON.parse(JSON.stringify(zone())) as ReturnType<typeof zone>,
      ],
    })
    return [maak(), maak(), maak()]
  }

  it('haalt een zone alleen uit het frame waar je staat', () => {
    const f = frames()
    verwijderSelectie(f, 1, new Set(['z1']))
    expect(f[0]!.entities.some((e) => e.id === 'z1')).toBe(true)
    expect(f[1]!.entities.some((e) => e.id === 'z1')).toBe(false)
    expect(f[2]!.entities.some((e) => e.id === 'z1')).toBe(true)
  })

  it('haalt een speler weg vanaf dit frame, zoals altijd', () => {
    const f = frames()
    verwijderSelectie(f, 1, new Set(['p1']))
    expect(f[0]!.entities.some((e) => e.id === 'p1')).toBe(true)
    expect(f[1]!.entities.some((e) => e.id === 'p1')).toBe(false)
    expect(f[2]!.entities.some((e) => e.id === 'p1')).toBe(false)
  })
})
