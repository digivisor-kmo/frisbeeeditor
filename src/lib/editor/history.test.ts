import { describe, expect, it } from 'vitest'
import { applyChange, emptyHistory, HISTORY_LIMIT, redo, undo } from './history'

interface Doc {
  items: { id: string; x: number }[]
}

const start = (): Doc => ({ items: [{ id: 'a', x: 0 }] })

function move(state: Doc, history: ReturnType<typeof emptyHistory>, x: number, groupId?: string) {
  return applyChange(state, history, 'verplaatsen', (draft) => {
    draft.items[0]!.x = x
  }, { groupId })
}

describe('undo en redo', () => {
  it('draait één wijziging terug en opnieuw vooruit', () => {
    const a = move(start(), emptyHistory(), 5)
    expect(a.state.items[0]!.x).toBe(5)

    const back = undo(a.state, a.history)
    expect(back.state.items[0]!.x).toBe(0)

    const forward = redo(back.state, back.history)
    expect(forward.state.items[0]!.x).toBe(5)
  })

  it('laat de oorspronkelijke state ongemoeid', () => {
    const original = start()
    const a = move(original, emptyHistory(), 5)
    expect(original.items[0]!.x).toBe(0)
    expect(a.state).not.toBe(original)
  })

  it('doet niets als er niets te ontdoen valt', () => {
    const state = start()
    const history = emptyHistory()
    expect(undo(state, history).state).toBe(state)
    expect(redo(state, history).state).toBe(state)
  })

  it('legt geen stap vast als de recipe niets verandert', () => {
    const result = applyChange(start(), emptyHistory(), 'niets', () => {})
    expect(result.changed).toBe(false)
    expect(result.history.undo).toHaveLength(0)
  })
})

describe('groeperen per gebruikershandeling', () => {
  it('vouwt vijftig pointermoves tot één undo-stap', () => {
    let state = start()
    let history = emptyHistory()
    for (let i = 1; i <= 50; i++) {
      const step = move(state, history, i, 'sleep-1')
      state = step.state
      history = step.history
    }

    expect(state.items[0]!.x).toBe(50)
    expect(history.undo).toHaveLength(1)

    const back = undo(state, history)
    expect(back.state.items[0]!.x).toBe(0)
  })

  it('houdt twee aparte sleepbewegingen uit elkaar', () => {
    const first = move(start(), emptyHistory(), 10, 'sleep-1')
    const second = move(first.state, first.history, 20, 'sleep-2')

    expect(second.history.undo).toHaveLength(2)

    const back = undo(second.state, second.history)
    expect(back.state.items[0]!.x).toBe(10)
  })

  it('groepeert niet zonder groepsleutel, ook niet bij hetzelfde label', () => {
    const first = move(start(), emptyHistory(), 10)
    const second = move(first.state, first.history, 20)
    expect(second.history.undo).toHaveLength(2)
  })

  it('kan een gegroepeerde stap ook opnieuw uitvoeren', () => {
    let state = start()
    let history = emptyHistory()
    for (const x of [1, 2, 3]) {
      const step = move(state, history, x, 'sleep-1')
      state = step.state
      history = step.history
    }
    const back = undo(state, history)
    const forward = redo(back.state, back.history)
    expect(forward.state.items[0]!.x).toBe(3)
  })
})

describe('redo-stapel', () => {
  it('vervalt zodra je na een undo iets nieuws doet', () => {
    const a = move(start(), emptyHistory(), 5)
    const back = undo(a.state, a.history)
    expect(back.history.redo).toHaveLength(1)

    const nieuw = move(back.state, back.history, 9)
    expect(nieuw.history.redo).toHaveLength(0)
    expect(nieuw.state.items[0]!.x).toBe(9)
  })
})

describe('toevoegen en verwijderen', () => {
  it('herstelt een verwijderde entiteit volledig', () => {
    const added = applyChange(start(), emptyHistory(), 'toevoegen', (draft) => {
      draft.items.push({ id: 'b', x: 3 })
    })
    const removed = applyChange(added.state, added.history, 'verwijderen', (draft) => {
      draft.items = draft.items.filter((i) => i.id !== 'b')
    })
    expect(removed.state.items).toHaveLength(1)

    const back = undo(removed.state, removed.history)
    expect(back.state.items).toEqual([
      { id: 'a', x: 0 },
      { id: 'b', x: 3 },
    ])
  })
})

describe('stapelgrootte', () => {
  it('houdt de stapel begrensd en gooit de oudste stap weg', () => {
    let state = start()
    let history = emptyHistory()
    for (let i = 1; i <= HISTORY_LIMIT + 10; i++) {
      const step = move(state, history, i)
      state = step.state
      history = step.history
    }
    expect(history.undo).toHaveLength(HISTORY_LIMIT)
  })
})
