import { describe, expect, it } from 'vitest'
import { createPlayer } from '@/lib/diagram/entities'
import { newDoc } from './document'
import { isCompleet, watOntbreekt } from './validatie'

function doc(over: Partial<{ naam: string; type: 'speelvariant'; categorie: string }> = {}) {
  const d = newDoc({ frameId: 'f1' })
  d.meta.naam = over.naam ?? ''
  d.meta.type = over.type ?? null
  d.meta.categorie = over.categorie ?? null
  return d
}

describe('watOntbreekt', () => {
  it('noemt alles wat er nog niet is bij een leeg diagram', () => {
    const velden = watOntbreekt(doc()).map((o) => o.veld)
    expect(velden).toEqual(['naam', 'type', 'categorie', 'spelers'])
  })

  it('telt een naam van alleen spaties niet mee', () => {
    expect(watOntbreekt(doc({ naam: '   ' })).map((o) => o.veld)).toContain('naam')
  })

  it('laat velden vallen zodra ze ingevuld zijn', () => {
    const d = doc({ naam: 'Vertical stack', type: 'speelvariant', categorie: 'vertical stack' })
    expect(watOntbreekt(d).map((o) => o.veld)).toEqual(['spelers'])
  })

  it('is compleet zodra er ook een speler staat', () => {
    const d = doc({ naam: 'Vertical stack', type: 'speelvariant', categorie: 'vertical stack' })
    d.frames[0]!.content.entities.push(
      createPlayer({ id: 'p1', pos: { x: 30, y: 18 }, side: 'offense', entities: [] }),
    )
    expect(watOntbreekt(d)).toEqual([])
    expect(isCompleet(d)).toBe(true)
  })
})
