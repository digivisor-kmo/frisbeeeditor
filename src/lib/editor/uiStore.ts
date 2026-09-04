import { create } from 'zustand'

/**
 * One explicit state machine for the editor instead of a handful of booleans
 * that can contradict each other.
 */
export type EditorMode =
  | 'idle'
  | 'dragging'
  | 'marquee'
  | 'drawingArrow'
  | 'drawingAnnotation'
  | 'editingText'

export type Tool = 'select' | 'player' | 'cone' | 'draw' | 'text'

interface UiStore {
  mode: EditorMode
  tool: Tool
  selection: Set<string>
  activeFrame: number
  /** Grid snapping, temporarily suspended while alt is held. */
  snap: boolean

  setMode: (mode: EditorMode) => void
  setTool: (tool: Tool) => void
  setSnap: (snap: boolean) => void
  setActiveFrame: (index: number) => void

  select: (ids: string[]) => void
  toggle: (id: string) => void
  clearSelection: () => void
  isSelected: (id: string) => boolean
}

export const useUiStore = create<UiStore>((set, get) => ({
  mode: 'idle',
  tool: 'select',
  selection: new Set<string>(),
  activeFrame: 0,
  snap: true,

  setMode: (mode) => set({ mode }),
  setTool: (tool) => set({ tool, mode: 'idle' }),
  setSnap: (snap) => set({ snap }),
  setActiveFrame: (activeFrame) => set({ activeFrame, selection: new Set<string>() }),

  select: (ids) => set({ selection: new Set(ids) }),
  toggle: (id) =>
    set((state) => {
      const next = new Set(state.selection)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selection: next }
    }),
  clearSelection: () => set({ selection: new Set<string>() }),
  isSelected: (id) => get().selection.has(id),
}))
