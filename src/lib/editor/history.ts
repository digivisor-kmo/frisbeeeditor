import { applyPatches, enablePatches, produceWithPatches, type Patch } from 'immer'

enablePatches()

export interface HistoryEntry {
  label: string
  /**
   * Identifies one continuous user gesture. Consecutive changes carrying the
   * same id are folded into a single undo step: one drag of fifty pointer moves
   * must undo as one action, not fifty. Undefined means "a step of its own".
   */
  groupId?: string
  patches: Patch[]
  inverse: Patch[]
}

export interface History {
  undo: HistoryEntry[]
  redo: HistoryEntry[]
}

export const emptyHistory = (): History => ({ undo: [], redo: [] })

/** How many user actions can be undone. Diagrams are small, so the stack is cheap. */
export const HISTORY_LIMIT = 100

export interface ApplyResult<T extends object> {
  state: T
  history: History
  changed: boolean
}

export function applyChange<T extends object>(
  state: T,
  history: History,
  label: string,
  recipe: (draft: T) => void,
  options: { groupId?: string } = {},
): ApplyResult<T> {
  const [next, patches, inverse] = produceWithPatches(state, recipe)

  // A recipe that changed nothing must not leave an empty step behind:
  // otherwise a click without a drag costs the user an undo press.
  if (patches.length === 0) {
    return { state, history, changed: false }
  }

  const { groupId } = options
  const last = history.undo[history.undo.length - 1]
  const canMerge =
    groupId !== undefined && last !== undefined && last.groupId === groupId && history.redo.length === 0

  let undo: HistoryEntry[]
  if (canMerge && last) {
    undo = [
      ...history.undo.slice(0, -1),
      {
        label,
        groupId,
        // Patches replay forward; inverse patches unwind in reverse order.
        patches: [...last.patches, ...patches],
        inverse: [...inverse, ...last.inverse],
      },
    ]
  } else {
    undo = [...history.undo, { label, groupId, patches, inverse }]
  }

  if (undo.length > HISTORY_LIMIT) undo = undo.slice(undo.length - HISTORY_LIMIT)

  return { state: next, history: { undo, redo: [] }, changed: true }
}

export function undo<T extends object>(state: T, history: History): { state: T; history: History } {
  const entry = history.undo[history.undo.length - 1]
  if (!entry) return { state, history }
  return {
    state: applyPatches(state as object, entry.inverse) as T,
    history: { undo: history.undo.slice(0, -1), redo: [...history.redo, entry] },
  }
}

export function redo<T extends object>(state: T, history: History): { state: T; history: History } {
  const entry = history.redo[history.redo.length - 1]
  if (!entry) return { state, history }
  return {
    state: applyPatches(state as object, entry.patches) as T,
    history: { undo: [...history.undo, entry], redo: history.redo.slice(0, -1) },
  }
}
