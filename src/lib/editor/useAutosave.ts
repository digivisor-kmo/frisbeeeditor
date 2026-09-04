'use client'

import { useEffect, useState } from 'react'
import { bewaarDiagram } from '@/lib/data/diagrams'
import { SlotKwijtError } from '@/lib/data/vergrendeling'
import { nl } from '@/lib/strings'
import { useDiagramStore } from './diagramStore'

export type BewaarStatus = 'schoon' | 'wachtend' | 'bezig' | 'bewaard' | 'fout'

/** How long after the last change the save fires. */
export const DEBOUNCE_MS = 2000

/**
 * Saves by itself instead of waiting for a Save button.
 *
 * A trainer who puts his phone in his pocket between two drills must not lose
 * work. The flip side is that there is no save moment left to report problems
 * at, so the status is shown permanently and a failure stays on screen.
 */
export function useAutosave(magBewerken = true) {
  const doc = useDiagramStore((s) => s.doc)
  const dirty = useDiagramStore((s) => s.dirty)
  const markSaved = useDiagramStore((s) => s.markSaved)

  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [ooitBewaard, setOoitBewaard] = useState(false)

  // No ref needed: the effect depends on `doc`, so every change cancels the
  // pending timer and starts a new one with the current document.
  useEffect(() => {
    // A player changes nothing, so there is nothing to try to save and fail at.
    if (!dirty || !doc.id || !magBewerken) return

    const timer = window.setTimeout(async () => {
      setBezig(true)
      try {
        await bewaarDiagram(doc)
        markSaved()
        setFout(null)
        setOoitBewaard(true)
      } catch (error) {
        // A trainer beside a field has no use for a Postgres policy name.
        if (error instanceof SlotKwijtError) {
          setFout(error.houder ? nl.slot.kwijtDoor(error.houder) : nl.slot.kwijt)
        } else {
          setFout(error instanceof Error ? error.message : nl.opslaan.fout)
        }
      } finally {
        setBezig(false)
      }
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [doc, dirty, markSaved, magBewerken])

  // Closing the tab with unsaved work is the one moment the browser can warn.
  useEffect(() => {
    if (!dirty) return
    const waarschuw = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', waarschuw)
    return () => window.removeEventListener('beforeunload', waarschuw)
  }, [dirty])

  const status: BewaarStatus = fout
    ? 'fout'
    : bezig
      ? 'bezig'
      : dirty
        ? 'wachtend'
        : ooitBewaard
          ? 'bewaard'
          : 'schoon'

  return { status, fout }
}
