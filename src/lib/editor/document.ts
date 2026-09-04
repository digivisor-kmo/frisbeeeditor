import {
  emptyFrameContent,
  type DiagramType,
  type FrameContent,
  type Tokenstijl,
  type Weergave,
} from '@/lib/diagram/schema'

export interface EditorFrame {
  id: string
  duurMs: number
  toelichting: string | null
  content: FrameContent
}

export interface EditorMeta {
  naam: string
  type: DiagramType | null
  categorie: string | null
  niveau: string | null
  tags: string[]
  weergave: Weergave
  tokenstijl: Tokenstijl
  draft: boolean
}

/** Everything the editor holds for one diagram. */
export interface EditorDoc {
  id: string | null
  meta: EditorMeta
  frames: EditorFrame[]
}

export const DEFAULT_FRAME_DURATION_MS = 1500

export function newFrame(id: string, content: FrameContent = emptyFrameContent()): EditorFrame {
  return { id, duurMs: DEFAULT_FRAME_DURATION_MS, toelichting: null, content }
}

export function newDoc(options: {
  frameId: string
  weergave?: Weergave
  naam?: string
  content?: FrameContent
}): EditorDoc {
  return {
    id: null,
    meta: {
      naam: options.naam ?? '',
      type: null,
      categorie: null,
      niveau: null,
      tags: [],
      weergave: options.weergave ?? 'volledig',
      tokenstijl: 'letters',
      draft: true,
    },
    frames: [newFrame(options.frameId, options.content)],
  }
}
