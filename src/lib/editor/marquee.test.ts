import { describe, expect, it } from 'vitest'
import { createArrow } from '@/lib/diagram/arrows'
import { createCone, createPlayer } from '@/lib/diagram/entities'
import type { Entity } from '@/lib/diagram/schema'
import {
  cirkelRaaktKader,
  entiteitenInKader,
  entiteitRaaktKader,
  kaderBreedte,
  kaderHoogte,
  maakKader,
  puntInKader,
} from './marquee'

const kader = maakKader({ x: 10, y: 10 }, { x: 20, y: 20 })

describe('maakKader', () => {
  it('werkt ongeacht in welke hoek je begint te slepen', () => {
    const linksboven = maakKader({ x: 10, y: 10 }, { x: 20, y: 20 })
    const rechtsonder = maakKader({ x: 20, y: 20 }, { x: 10, y: 10 })
    const gemengd = maakKader({ x: 20, y: 10 }, { x: 10, y: 20 })
    expect(rechtsonder).toEqual(linksboven)
    expect(gemengd).toEqual(linksboven)
  })

  it('geeft breedte en hoogte', () => {
    expect(kaderBreedte(kader)).toBe(10)
    expect(kaderHoogte(kader)).toBe(10)
  })
})

describe('puntInKader', () => {
  it('telt de rand mee', () => {
    expect(puntInKader({ x: 10, y: 10 }, kader)).toBe(true)
    expect(puntInKader({ x: 20, y: 20 }, kader)).toBe(true)
  })

  it('sluit alles erbuiten uit', () => {
    expect(puntInKader({ x: 9.9, y: 15 }, kader)).toBe(false)
    expect(puntInKader({ x: 15, y: 20.1 }, kader)).toBe(false)
  })
})

describe('cirkelRaaktKader', () => {
  it('raakt als het midden erin ligt', () => {
    expect(cirkelRaaktKader({ x: 15, y: 15 }, 1, kader)).toBe(true)
  })

  it('raakt ook als alleen de rand van het token erin valt', () => {
    expect(cirkelRaaktKader({ x: 21, y: 15 }, 1.5, kader)).toBe(true)
  })

  it('raakt net niet als de cirkel er net buiten blijft', () => {
    expect(cirkelRaaktKader({ x: 22, y: 15 }, 1.5, kader)).toBe(false)
  })

  it('rekent de hoek als hoek, niet als zijde', () => {
    // Diagonaal net buiten de hoek: afstand is sqrt(2) ~ 1.414.
    expect(cirkelRaaktKader({ x: 21, y: 21 }, 1.3, kader)).toBe(false)
    expect(cirkelRaaktKader({ x: 21, y: 21 }, 1.5, kader)).toBe(true)
  })
})

describe('entiteiten vangen', () => {
  const speler = createPlayer({ id: 'p1', pos: { x: 15, y: 15 }, side: 'offense', entities: [] })
  const verWeg = createPlayer({ id: 'p2', pos: { x: 60, y: 30 }, side: 'defense', entities: [] })
  const pion = createCone({ id: 'c1', pos: { x: 12, y: 19 }, entities: [] })
  const entities: Entity[] = [speler, verWeg, pion]

  it('vangt wat het kader raakt en laat de rest staan', () => {
    expect(entiteitenInKader(entities, kader, 1.5).sort()).toEqual(['c1', 'p1'])
  })

  it('vangt een arrow die alleen met zijn lijf door het kader loopt', () => {
    // Begin en eind liggen buiten het kader, de lijn er dwars doorheen.
    const arrow = createArrow({
      id: 'a1',
      ownerId: 'p9',
      van: { x: 2, y: 15 },
      kind: 'cut',
      weergave: 'volledig',
      entities: [],
    })
    arrow.path.points = [
      { x: 2, y: 15 },
      { x: 40, y: 15 },
    ]
    expect(entiteitRaaktKader(arrow, kader, 1.5)).toBe(true)
  })

  it('vangt een arrow niet als hij er netjes omheen loopt', () => {
    const arrow = createArrow({
      id: 'a2',
      ownerId: 'p9',
      van: { x: 2, y: 30 },
      kind: 'cut',
      weergave: 'volledig',
      entities: [],
    })
    arrow.path.points = [
      { x: 2, y: 30 },
      { x: 40, y: 30 },
    ]
    expect(entiteitRaaktKader(arrow, kader, 1.5)).toBe(false)
  })

  it('vangt een gebogen arrow waarvan alleen de bocht in het kader hangt', () => {
    const arrow = createArrow({
      id: 'a3',
      ownerId: 'p9',
      van: { x: 5, y: 5 },
      kind: 'cut',
      weergave: 'volledig',
      entities: [],
    })
    arrow.path.points = [
      { x: 5, y: 5 },
      { x: 15, y: 15 },
      { x: 25, y: 5 },
    ]
    expect(entiteitRaaktKader(arrow, kader, 1.5)).toBe(true)
  })

  it('geeft een lege lijst bij een kader op leeg gras', () => {
    const leeg = maakKader({ x: 80, y: 2 }, { x: 90, y: 8 })
    expect(entiteitenInKader(entities, leeg, 1.5)).toEqual([])
  })
})
