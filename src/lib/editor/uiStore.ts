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
  /** True while something on the field is being dragged, so overlays can step aside. */
  sleept: boolean
  tool: Tool
  selection: Set<string>
  activeFrame: number
  /** Grid snapping, temporarily suspended while alt is held. */
  snap: boolean
  /**
   * Whether the context menu is showing for the current selection. A tap opens
   * it; a drag does not, because during a drag the arc would sit in the way of
   * the thing you are moving.
   */
  menuOpen: boolean
  /**
   * Index in `path.points` of the bend that shows its delete cross. Only one at
   * a time, otherwise a curve with four bends becomes a field of little crosses.
   */
  actieveBocht: number | null

  /** How far the field is zoomed in, and where the window sits. */
  zoom: number
  pan: { x: number; y: number }

  /** Playback. The speed and the focus are viewing settings and are not stored. */
  speelt: boolean
  tijdMs: number
  snelheid: number
  lussen: boolean
  /** True while the scrubber is being dragged, so the field shows the in-between. */
  scrubt: boolean
  focus: 'offense' | 'defense' | 'beide'

  setMode: (mode: EditorMode) => void
  setSleept: (sleept: boolean) => void
  setTool: (tool: Tool) => void
  setSnap: (snap: boolean) => void
  setMenuOpen: (open: boolean) => void
  setActieveBocht: (index: number | null) => void
  setCamera: (zoom: number, pan: { x: number; y: number }) => void
  resetCamera: () => void

  setSpeelt: (speelt: boolean) => void
  setTijd: (tijdMs: number) => void
  setSnelheid: (snelheid: number) => void
  setLussen: (lussen: boolean) => void
  setScrubt: (scrubt: boolean) => void
  setFocus: (focus: 'offense' | 'defense' | 'beide') => void
  setActiveFrame: (index: number) => void

  select: (ids: string[]) => void
  toggle: (id: string) => void
  clearSelection: () => void
  isSelected: (id: string) => boolean
  /**
   * Drops ids that no longer exist. Undo can remove an entity that is still
   * selected, and a selection pointing at nothing makes the delete button lie
   * about how much it will remove.
   */
  pruneSelection: (bestaandeIds: ReadonlySet<string>) => void
}

export const useUiStore = create<UiStore>((set, get) => ({
  mode: 'idle',
  sleept: false,
  tool: 'select',
  selection: new Set<string>(),
  activeFrame: 0,
  snap: true,
  menuOpen: false,
  actieveBocht: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  speelt: false,
  tijdMs: 0,
  snelheid: 1,
  lussen: false,
  scrubt: false,
  focus: 'beide',

  setMode: (mode) => set({ mode }),
  setSleept: (sleept) => set({ sleept }),
  setTool: (tool) => set({ tool, mode: 'idle', menuOpen: false }),
  setSnap: (snap) => set({ snap }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setActieveBocht: (actieveBocht) => set({ actieveBocht }),
  setCamera: (zoom, pan) => set({ zoom, pan }),
  resetCamera: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),

  // Playing is a way of looking, not of editing: the selection steps aside.
  setSpeelt: (speelt) =>
    set(speelt ? { speelt, selection: new Set<string>(), menuOpen: false } : { speelt }),
  setTijd: (tijdMs) => set({ tijdMs }),
  setSnelheid: (snelheid) => set({ snelheid }),
  setLussen: (lussen) => set({ lussen }),
  setScrubt: (scrubt) => set({ scrubt }),
  setFocus: (focus) => set({ focus }),
  setActiveFrame: (activeFrame) =>
    set({ activeFrame, selection: new Set<string>(), menuOpen: false }),

  select: (ids) => set({ selection: new Set(ids), actieveBocht: null }),
  toggle: (id) =>
    set((state) => {
      const next = new Set(state.selection)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selection: next }
    }),
  clearSelection: () =>
    set({ selection: new Set<string>(), menuOpen: false, actieveBocht: null }),
  isSelected: (id) => get().selection.has(id),
  pruneSelection: (bestaandeIds) =>
    set((state) => {
      const next = new Set<string>()
      for (const id of state.selection) if (bestaandeIds.has(id)) next.add(id)
      if (next.size === state.selection.size) return state
      return { selection: next, menuOpen: next.size === 1 ? state.menuOpen : false }
    }),
}))
