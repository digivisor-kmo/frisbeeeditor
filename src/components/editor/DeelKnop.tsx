'use client'

import { useRef, useState } from 'react'
import { Knop } from '@/components/ui/Knop'
import { useOmklappen } from '@/components/ui/useOmklappen'
import { maakDeellink } from '@/lib/data/delen'
import { nl } from '@/lib/strings'
import { DeelIcon } from './icons'

/**
 * Makes a link and puts it on the clipboard in one press.
 *
 * The link is also shown in full, because a clipboard is invisible: without the
 * text on screen you cannot tell whether the press did anything, and on a phone
 * you cannot paste it into a chat by hand either.
 */
export function DeelKnop({ diagramId }: { diagramId: string | null }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [tot, setTot] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [gekopieerd, setGekopieerd] = useState(false)

  const knopRef = useRef<HTMLButtonElement>(null)
  const paneelRef = useRef<HTMLDivElement>(null)
  const richting = useOmklappen(knopRef, paneelRef, open, 'onder')

  async function delen() {
    if (!diagramId) return
    setBezig(true)
    setFout(null)
    try {
      const link = await maakDeellink(diagramId)
      const volledig = `${window.location.origin}/gedeeld/${link.token}`
      setUrl(volledig)
      setTot(
        new Date(link.verlooptOp).toLocaleDateString('nl-BE', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      )
      setOpen(true)
      try {
        await navigator.clipboard.writeText(volledig)
        setGekopieerd(true)
      } catch {
        // A browser that refuses the clipboard still shows the link below.
        setGekopieerd(false)
      }
    } catch (error) {
      setFout(error instanceof Error ? error.message : String(error))
      setOpen(true)
    } finally {
      setBezig(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <Knop
        ref={knopRef}
        klein
        className="btn--icoon"
        disabled={!diagramId || bezig}
        aria-label={nl.speler.delen}
        title={nl.speler.delen}
        onClick={() => (open ? setOpen(false) : void delen())}
      >
        <DeelIcon />
      </Knop>

      {open && (
        <div
          ref={paneelRef}
          className="zwevend deelpaneel"
          style={{ [richting === 'onder' ? 'top' : 'bottom']: 'calc(100% + 6px)' }}
        >
          {fout ? (
            <p className="melding melding--fout" style={{ margin: 0 }}>
              {nl.speler.delenFout} {fout}
            </p>
          ) : (
            <>
              <p className="veld-label" style={{ marginBottom: 'var(--ruimte-2)' }}>
                {gekopieerd ? nl.speler.delenGekopieerd : nl.speler.delen}
              </p>
              <input className="invoer deelpaneel__url" readOnly value={url ?? ''} onFocus={(e) => e.target.select()} />
              {tot && (
                <p className="stil" style={{ fontSize: 'var(--tekst-xs)', marginTop: 'var(--ruimte-2)' }}>
                  {nl.speler.delenUitleg(tot)}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
