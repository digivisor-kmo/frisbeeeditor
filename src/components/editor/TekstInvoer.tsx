'use client'

import { useEffect, useRef } from 'react'
import { nl } from '@/lib/strings'

interface Props {
  /** Where on the canvas the note sits, in CSS pixels. */
  anker: { x: number; y: number }
  vraag: string
  plaatshouder: string
  waarde: string
  /** A zone keeps its name when you empty the field; a note has to say something. */
  leegMag?: boolean
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
export function TekstInvoer({
  anker,
  vraag,
  plaatshouder,
  waarde,
  leegMag = false,
  onWijzig,
  onBewaar,
  onAnnuleer,
}: Props) {
  const veld = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Twice, and the second time after the browser has finished the click that
    // opened this. That click ends on the field, and the field takes the focus
    // back with it — so focusing only on mount leaves you typing into nothing.
    const pak = () => {
      veld.current?.focus()
      veld.current?.select()
    }
    pak()
    const frame = requestAnimationFrame(pak)
    const later = window.setTimeout(pak, 60)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(later)
    }
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
        placeholder={plaatshouder}
        aria-label={vraag}
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
          disabled={!leegMag && waarde.trim().length === 0}
          onClick={onBewaar}
        >
          {nl.tekst.bewaren}
        </button>
      </div>
    </div>
  )
}
