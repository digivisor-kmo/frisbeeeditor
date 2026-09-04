import { beforeEach, describe, expect, it } from 'vitest'
import { canRedo, canUndo, useDiagramStore } from './diagramStore'
import { newDoc } from './document'
import { useUiStore } from './uiStore'

const reset = () => useDiagramStore.getState().load(newDoc({ frameId: 'f1', naam: 'Test' }))

describe('diagramStore', () => {
  beforeEach(reset)

  it('start met één frame en zonder geschiedenis', () => {
    const state = useDiagramStore.getState()
    expect(state.doc.frames).toHaveLength(1)
    expect(canUndo(state)).toBe(false)
    expect(state.dirty).toBe(false)
  })

  it('markeert het document als gewijzigd na een verandering', () => {
    useDiagramStore.getState().change('naam', (d) => {
      d.meta.naam = 'Vertical stack'
    })
    const state = useDiagramStore.getState()
    expect(state.doc.meta.naam).toBe('Vertical stack')
    expect(state.dirty).toBe(true)
    expect(canUndo(state)).toBe(true)
  })

  it('negeert een verandering die niets doet', () => {
    const before = useDiagramStore.getState().doc
    useDiagramStore.getState().change('niets', () => {})
    const after = useDiagramStore.getState()
    expect(after.doc).toBe(before)
    expect(after.dirty).toBe(false)
  })

  it('vouwt een sleepbeweging tot één undo-stap', () => {
    const { change } = useDiagramStore.getState()
    for (const naam of ['a', 'ab', 'abc']) {
      change('naam', (d) => {
        d.meta.naam = naam
      }, 'gebaar-1')
    }
    expect(useDiagramStore.getState().history.undo).toHaveLength(1)

    useDiagramStore.getState().undo()
    expect(useDiagramStore.getState().doc.meta.naam).toBe('Test')
    expect(canRedo(useDiagramStore.getState())).toBe(true)
  })

  it('wist de dirty-vlag bij opslaan', () => {
    useDiagramStore.getState().change('naam', (d) => {
      d.meta.naam = 'x'
    })
    useDiagramStore.getState().markSaved()
    expect(useDiagramStore.getState().dirty).toBe(false)
  })
})

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ mode: 'idle', tool: 'select', selection: new Set(), activeFrame: 0 })
  })

  it('vervangt de selectie bij select en wisselt bij toggle', () => {
    const ui = useUiStore.getState()
    ui.select(['a', 'b'])
    expect([...useUiStore.getState().selection]).toEqual(['a', 'b'])

    useUiStore.getState().toggle('b')
    expect([...useUiStore.getState().selection]).toEqual(['a'])

    useUiStore.getState().toggle('c')
    expect([...useUiStore.getState().selection]).toEqual(['a', 'c'])
  })

  it('zet de modus terug op idle bij een ander gereedschap', () => {
    useUiStore.setState({ mode: 'drawingArrow' })
    useUiStore.getState().setTool('player')
    expect(useUiStore.getState().mode).toBe('idle')
  })

  it('leegt de selectie bij het wisselen van frame', () => {
    useUiStore.getState().select(['a'])
    useUiStore.getState().setActiveFrame(1)
    expect(useUiStore.getState().selection.size).toBe(0)
  })
})
