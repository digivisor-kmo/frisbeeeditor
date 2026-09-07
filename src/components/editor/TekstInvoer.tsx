'use client'

import { useEffect, useRef } from 'react'
import { nl } from '@/lib/strings'

interface Props {
  /** Where on the canvas the note sits, in CSS pixels. */
  anker: { x: number; y: number }
  waarde: string
  onWijzig: (waarde: string) => void
  onBewaar: () => void
  onAnnuleer: () => void
}

/**
 * Typing a note, right where it will stand.
 *
 * An HTML input rather than an editable SVG text: it brings a caret, selection,
 * autocorrect and the phone keyboard with it, none of which exist inside an
 * SVG. It sits above the field and points at the spot you tapped.
 */
export function TekstInvoer({ anker, waarde, onWijzig, onBewaar, onAnnuleer }: Props) {
  const veld = useRef<HTMLInputElement>(null)

  useEffect(() => {
    veld.current?.focus()
    veld.current?.select()
  }, [])

  return (
    <div
      className="tekstinvoer"
      style={{ left: anker.x, top: anker.y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <input
        ref={veld}
        className="invoer"
        value={waarde}
        maxLength={280}
        placeholder={nl.tekst.placeholder}
        aria-label={nl.tekst.vraag}
        onChange={(e) => onWijzig(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onBewaar()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            onAnnuleer()
          }
        }}
      />
      <div className="tekstinvoer__knoppen">
        <button type="button" className="btn btn--klein" onClick={onAnnuleer}>
          {nl.tekst.annuleren}
        </button>
        <button
          type="button"
          className="btn btn--klein btn--primair"
          disabled={waarde.trim().length === 0}
          onClick={onBewaar}
        >
          {nl.tekst.bewaren}
        </button>
      </div>
    </div>
  )
}
