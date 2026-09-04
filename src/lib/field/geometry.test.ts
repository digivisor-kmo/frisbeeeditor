import { describe, expect, it } from 'vitest'
import {
  BRICK_MARKS_M,
  CENTRAL_ZONE_M,
  createView,
  maakCamera,
  MAX_ZOOM,
  zoomOmPunt,
  FIELD_M,
  GOAL_LINES_M,
  snapToGrid,
  toField,
  toScreenPx,
  toSvg,
  UNITS_PER_METRE,
} from './geometry'

describe('field constants', () => {
  it('matches the WFDF outdoor field', () => {
    expect(FIELD_M.length).toBe(100)
    expect(FIELD_M.width).toBe(37)
    expect(FIELD_M.endzoneDepth).toBe(18)
    expect(CENTRAL_ZONE_M).toBe(64)
  })

  it('puts the goal lines 18 m from each end', () => {
    expect(GOAL_LINES_M).toEqual([18, 82])
  })

  it('puts the brick marks 18 m from their own goal line on the centre axis', () => {
    expect(BRICK_MARKS_M).toEqual([
      { x: 36, y: 18.5 },
      { x: 64, y: 18.5 },
    ])
  })
})

describe('volledig veld', () => {
  const view = createView('volledig')

  it('scales the field to exactly 1000 x 370 units', () => {
    expect(toSvg({ x: 0, y: 0 }, view)).toEqual({ x: 0, y: 370 })
    expect(toSvg({ x: 100, y: 37 }, view)).toEqual({ x: 1000, y: 0 })
  })

  it('flips the y axis so y grows upward on the field', () => {
    const low = toSvg({ x: 50, y: 5 }, view)
    const high = toSvg({ x: 50, y: 30 }, view)
    expect(high.y).toBeLessThan(low.y)
  })

  it('adds a 3 m margin on every side', () => {
    expect(view.viewBox).toBe('-30 -30 1060 430')
  })

  it('uses 10 units per metre', () => {
    const a = toSvg({ x: 10, y: 0 }, view)
    const b = toSvg({ x: 11, y: 0 }, view)
    expect(b.x - a.x).toBe(UNITS_PER_METRE)
  })
})

describe('half veld', () => {
  const view = createView('half')

  it('is portrait: 43 units wide per 10 m across, 56 m long', () => {
    expect(view.viewBox).toBe('-30 -30 430 560')
    expect(view.height).toBeGreaterThan(view.width)
  })

  it('rotates 90 degrees clockwise without mirroring', () => {
    // Back of the endzone sits at the top.
    expect(toSvg({ x: 0, y: 18.5 }, view).y).toBe(0)
    // The sideline at y = 0 stays on the left, as it is in the landscape view.
    expect(toSvg({ x: 25, y: 0 }, view).x).toBe(0)
    expect(toSvg({ x: 25, y: 37 }, view).x).toBe(370)
  })
})

describe('vrij vlak', () => {
  it('uses the same geometry but draws no lines', () => {
    const view = createView('vrij')
    expect(view.showLines).toBe(false)
    expect(view.viewBox).toBe(createView('volledig').viewBox)
  })
})

describe('toField', () => {
  it.each(['volledig', 'half', 'vrij'] as const)('is the exact inverse of toSvg for %s', (kind) => {
    const view = createView(kind)
    for (const p of [
      { x: 0, y: 0 },
      { x: 12.5, y: 3.25 },
      { x: 50, y: 18.5 },
      { x: 100, y: 37 },
      { x: -2, y: 40 },
    ]) {
      const back = toField(toSvg(p, view), view)
      expect(back.x).toBeCloseTo(p.x, 10)
      expect(back.y).toBeCloseTo(p.y, 10)
    }
  })
})

describe('snapToGrid', () => {
  it('snaps to half metres', () => {
    expect(snapToGrid({ x: 12.24, y: 3.3 })).toEqual({ x: 12, y: 3.5 })
    expect(snapToGrid({ x: 12.26, y: 3.74 })).toEqual({ x: 12.5, y: 3.5 })
  })

  it('accepts a different step', () => {
    expect(snapToGrid({ x: 12.4, y: 3.3 }, 1)).toEqual({ x: 12, y: 3 })
  })
})

describe('toScreenPx', () => {
  it('zet de linkerbovenhoek van de viewBox op nul', () => {
    const view = createView('volledig')
    // De viewBox begint 3 meter links van en boven het veld.
    const metresPerPixel = 106 / 1060 // precies 1 pixel per SVG-eenheid
    const hoek = toScreenPx({ x: -3, y: 40 }, view, metresPerPixel)
    expect(hoek.x).toBeCloseTo(0, 6)
    expect(hoek.y).toBeCloseTo(0, 6)
  })

  it('schaalt mee met de gerenderde breedte', () => {
    const view = createView('volledig')
    const smal = toScreenPx({ x: 50, y: 18.5 }, view, 106 / 400)
    const breed = toScreenPx({ x: 50, y: 18.5 }, view, 106 / 800)
    expect(breed.x).toBeCloseTo(smal.x * 2, 6)
  })
})

describe('camera', () => {
  const view = createView('volledig')

  it('toont bij zoom 1 precies de hele viewBox', () => {
    const camera = maakCamera(view, 1, { x: 0, y: 0 })
    expect(camera.viewBox).toBe(view.viewBox)
  })

  it('toont bij zoom 2 een half zo breed venster', () => {
    const camera = maakCamera(view, 2, { x: 0, y: 0 })
    expect(camera.width).toBeCloseTo(view.width / 2, 6)
    expect(camera.height).toBeCloseTo(view.height / 2, 6)
  })

  it('kijkt nooit voorbij de rand van het getekende vlak', () => {
    const ver = maakCamera(view, 2, { x: 99999, y: 99999 })
    expect(ver.origin.x + ver.width).toBeCloseTo(view.origin.x + view.width, 6)
    expect(ver.origin.y + ver.height).toBeCloseTo(view.origin.y + view.height, 6)

    const terug = maakCamera(view, 2, { x: -99999, y: -99999 })
    expect(terug.origin.x).toBeCloseTo(view.origin.x, 6)
    expect(terug.origin.y).toBeCloseTo(view.origin.y, 6)
  })

  it('klemt de zoom aan beide kanten', () => {
    expect(maakCamera(view, 0.1, { x: 0, y: 0 }).width).toBeCloseTo(view.width, 6)
    expect(maakCamera(view, 99, { x: 0, y: 0 }).width).toBeCloseTo(view.width / MAX_ZOOM, 6)
  })

  it('houdt het punt onder je vinger op zijn plek tijdens het zoomen', () => {
    // Het midden van het veld, precies in het midden van het element.
    const vast = toSvg({ x: 50, y: 18.5 }, view)
    const fractie = { x: 0.5, y: 0.5 }
    const pan = zoomOmPunt(view, 3, vast, fractie)
    const camera = maakCamera(view, 3, pan)

    const opnieuw = {
      x: camera.origin.x + fractie.x * camera.width,
      y: camera.origin.y + fractie.y * camera.height,
    }
    expect(opnieuw.x).toBeCloseTo(vast.x, 6)
    expect(opnieuw.y).toBeCloseTo(vast.y, 6)
  })

  it('werkt ook als het vaste punt niet in het midden ligt', () => {
    const vast = toSvg({ x: 20, y: 6 }, view)
    const fractie = { x: 0.2, y: 0.8 }
    const camera = maakCamera(view, 2.5, zoomOmPunt(view, 2.5, vast, fractie))
    expect(camera.origin.x + fractie.x * camera.width).toBeCloseTo(vast.x, 6)
    expect(camera.origin.y + fractie.y * camera.height).toBeCloseTo(vast.y, 6)
  })
})
