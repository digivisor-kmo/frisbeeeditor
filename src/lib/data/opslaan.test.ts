import { describe, expect, it } from 'vitest'
import { produce } from 'immer'
import { newDoc, newFrame } from '@/lib/editor/document'
import { emptyFrameContent } from '@/lib/diagram/schema'
import type { EditorDoc } from '@/lib/editor/document'

/**
 * The save path decides what to send by comparing object identity against the
 * last saved document. That only works because immer shares structure, so this
 * test pins the property the whole optimisation rests on: editing one frame
 * must leave the other frames literally untouched.
 */
describe('structurele deling tussen frames', () => {
  const basis = (): EditorDoc => ({
    ...newDoc({ frameId: 'f1' }),
    id: 'd1',
    frames: [
      newFrame('f1', emptyFrameContent()),
      newFrame('f2', emptyFrameContent()),
      newFrame('f3', emptyFrameContent()),
    ],
  })

  it('laat ongewijzigde frames dezelfde objecten', () => {
    const voor = basis()
    const na = produce(voor, (draft) => {
      draft.frames[1]!.content.entities.push({
        id: 'p1',
        type: 'player',
        z: 1,
        pos: { x: 10, y: 10 },
        side: 'offense',
        role: 'handler',
        color: 'standaard',
        hasDisc: false,
      })
    })

    expect(na.frames[1]).not.toBe(voor.frames[1])
    expect(na.frames[0]).toBe(voor.frames[0])
    expect(na.frames[2]).toBe(voor.frames[2])
    expect(na.meta).toBe(voor.meta)
  })

  it('raakt de frames niet aan bij een wijziging in de meta', () => {
    const voor = basis()
    const na = produce(voor, (draft) => {
      draft.meta.naam = 'Nieuw'
    })

    expect(na.meta).not.toBe(voor.meta)
    for (let i = 0; i < voor.frames.length; i++) {
      expect(na.frames[i]).toBe(voor.frames[i])
    }
  })
})
