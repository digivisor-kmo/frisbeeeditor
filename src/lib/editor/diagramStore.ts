import { create } from 'zustand'
import {
  applyChange,
  emptyHistory,
  redo as redoPatches,
  undo as undoPatches,
  type History,
} from './history'
import { volgendFrame } from '@/lib/diagram/frames'
import { newDoc, newFrame, type EditorDoc } from './document'
import { newId } from './ids'

interface DiagramStore {
  doc: EditorDoc
  history: History
  /** True when the document differs from what is stored in Supabase. */
  dirty: boolean
  /**
   * The document as it last went into the database.
   *
   * Immer gives structural sharing, so comparing this frame by frame against
   * the current one says exactly which frames changed — and a save then writes
   * those and nothing else.
   */
  bewaard: EditorDoc | null

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
  markSaved: (doc: EditorDoc) => void

  /** Adds the continuation of frame `index` right after it, and returns its position. */
  voegFrameToe: (index: number) => number
  dupliceerFrame: (index: number) => number
  verwijderFrame: (index: number) => void
  verplaatsFrame: (van: number, naar: number) => void
  zetFrameDuur: (index: number, duurMs: number) => void
}

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  doc: newDoc({ frameId: newId() }),
  history: emptyHistory(),
  dirty: false,
  bewaard: null,

  load: (doc) => set({ doc, history: emptyHistory(), dirty: false, bewaard: doc }),

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

  // What went in is what we compare against next time. Anything the trainer
  // changed while the save was in flight keeps the document dirty.
  markSaved: (doc) => set((state) => ({ dirty: state.doc !== doc, bewaard: doc })),

  voegFrameToe: (index) => {
    const bron = get().doc.frames[index]
    if (!bron) return index
    const frame = newFrame(newId(), volgendFrame(bron.content))
    get().change('Frame toevoegen', (draft) => {
      draft.frames.splice(index + 1, 0, frame)
    })
    return index + 1
  },

  dupliceerFrame: (index) => {
    const bron = get().doc.frames[index]
    if (!bron) return index
    // A copy is a copy: the same entities in the same spots, with a new frame id.
    const kopie = {
      ...bron,
      id: newId(),
      content: JSON.parse(JSON.stringify(bron.content)) as typeof bron.content,
    }
    get().change('Frame dupliceren', (draft) => {
      draft.frames.splice(index + 1, 0, kopie)
    })
    return index + 1
  },

  verwijderFrame: (index) =>
    get().change('Frame verwijderen', (draft) => {
      // A diagram always has at least one frame.
      if (draft.frames.length <= 1) return
      draft.frames.splice(index, 1)
    }),

  verplaatsFrame: (van, naar) =>
    get().change('Frame verplaatsen', (draft) => {
      if (van === naar) return
      const frame = draft.frames[van]
      if (!frame) return
      draft.frames.splice(van, 1)
      draft.frames.splice(naar, 0, frame)
    }),

  zetFrameDuur: (index, duurMs) =>
    get().change(
      'Frameduur',
      (draft) => {
        const frame = draft.frames[index]
        if (frame) frame.duurMs = duurMs
      },
      `duur-${index}`,
    ),
}))

export const canUndo = (state: DiagramStore) => state.history.undo.length > 0
export const canRedo = (state: DiagramStore) => state.history.redo.length > 0
