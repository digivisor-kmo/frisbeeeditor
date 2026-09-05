'use client'

import { nl } from '@/lib/strings'

/**
 * Asks for the other orientation, and blocks until it gets it.
 *
 * A browser cannot turn a phone: iOS has no API for it at all, and Android only
 * honours the manifest for an installed app, and then for the whole app rather
 * than per diagram. So this does what every app that needs one orientation
 * does: it stops, says which way, and waits.
 *
 * Only on a phone. A tablet in the wrong orientation still has room.
 */
export function DraaiScherm({ naarLiggend }: { naarLiggend: boolean }) {
  return (
    <div className="draaischerm" role="dialog" aria-modal="true">
      <div className="draaischerm__binnen">
        <svg
          className={`draaischerm__toestel${naarLiggend ? ' draaischerm__toestel--draai' : ''}`}
          viewBox="0 0 100 160"
          aria-hidden
        >
          <rect x="14" y="4" width="72" height="152" rx="12" fill="none" stroke="currentColor" strokeWidth="5" />
          <rect x="24" y="20" width="52" height="112" rx="4" fill="currentColor" opacity="0.16" />
          <circle cx="50" cy="144" r="4.5" fill="currentColor" opacity="0.5" />
        </svg>

        <p className="kop">{naarLiggend ? nl.draai.naarLiggend : nl.draai.naarStaand}</p>
        <p className="stil">{naarLiggend ? nl.draai.liggendUitleg : nl.draai.staandUitleg}</p>
      </div>
    </div>
  )
}
