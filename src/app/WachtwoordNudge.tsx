'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Knop } from '@/components/ui/Knop'
import { nl } from '@/lib/strings'

const SLEUTEL = 'ducs.wachtwoordnudge'
const GEBEURTENIS = 'ducs:nudge'

function lees(): boolean {
  try {
    return window.sessionStorage.getItem(SLEUTEL) !== 'weg'
  } catch {
    // A browser that refuses storage simply shows the reminder.
    return true
  }
}

function abonneer(bijWijziging: () => void): () => void {
  window.addEventListener(GEBEURTENIS, bijWijziging)
  return () => window.removeEventListener(GEBEURTENIS, bijWijziging)
}

function sluit(): void {
  try {
    window.sessionStorage.setItem(SLEUTEL, 'weg')
  } catch {
    // Nothing to do: it comes back next time, which is harmless.
  }
  window.dispatchEvent(new Event(GEBEURTENIS))
}

/**
 * One quiet reminder that a password exists, not a nag. Dismissing it lasts as
 * long as the browser session, so it may come back another day but never twice
 * in the same sitting.
 */
export function WachtwoordNudge() {
  const zichtbaar = useSyncExternalStore(abonneer, lees, () => false)
  if (!zichtbaar) return null

  return (
    <div className="nudge">
      <div>
        <strong>{nl.account.nudgeTitel}</strong>
        <p className="stil" style={{ margin: 0 }}>
          {nl.account.nudgeUitleg}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--ruimte-2)', marginLeft: 'auto' }}>
        <Link href="/account" className="btn btn--klein btn--primair">
          {nl.account.nudgeKnop}
        </Link>
        <Knop klein onClick={sluit}>
          {nl.account.nudgeLater}
        </Knop>
      </div>
    </div>
  )
}
