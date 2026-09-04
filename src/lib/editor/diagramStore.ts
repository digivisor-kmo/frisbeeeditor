import { create } from 'zustand'
import {
  applyChange,
  emptyHistory,
  redo as redoPatches,
  undo as undoPatches,
  type History,
} from './history'
import { newDoc, type EditorDoc } from './document'
import { newId } from './ids'

interface DiagramStore {
  doc: EditorDoc
  history: History
  /** True when the document differs from what is stored in Supabase. */
  dirty: boolean

  /** Replaces the document, for example after loading one from the database. */
  load: (doc: EditorDoc) => void

  /**
   * The only way to change the document. `groupId` folds a continuous gesture
   * into one undo step; pass a fresh id on pointerdown and reuse it until
   * pointerup.
   */
  change: (label: string, recipe: (draft: EditorDoc) => void, groupId?: string) => void

  undo: () => void
  redo: () => void
  markSaved: () => void
}

export const useDiagramStore = create<DiagramStore>((set) => ({
  doc: newDoc({ frameId: newId() }),
  history: emptyHistory(),
  dirty: false,

  load: (doc) => set({ doc, history: emptyHistory(), dirty: false }),

  change: (label, recipe, groupId) =>
    set((state) => {
      const result = applyChange(state.doc, state.history, label, recipe, { groupId })
      if (!result.changed) return state
      return { doc: result.state, history: result.history, dirty: true }
    }),

  undo: () =>
    set((state) => {
      const result = undoPatches(state.doc, state.history)
      if (result.state === state.doc) return state
      return { doc: result.state, history: result.history, dirty: true }
    }),

  redo: () =>
    set((state) => {
      const result = redoPatches(state.doc, state.history)
      if (result.state === state.doc) return state
      return { doc: result.state, history: result.history, dirty: true }
    }),

  markSaved: () => set({ dirty: false }),
}))

export const canUndo = (state: DiagramStore) => state.history.undo.length > 0
export const canRedo = (state: DiagramStore) => state.history.redo.length > 0
