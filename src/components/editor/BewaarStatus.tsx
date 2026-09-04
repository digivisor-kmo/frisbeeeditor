'use client'

import type { BewaarStatus as Status } from '@/lib/editor/useAutosave'
import { nl } from '@/lib/strings'

const TEKST: Record<Status, string> = {
  schoon: nl.opslaan.schoon,
  wachtend: nl.opslaan.wachtend,
  bezig: nl.opslaan.bezig,
  bewaard: nl.opslaan.bewaard,
  fout: nl.opslaan.fout,
}

export function BewaarStatusLabel({ status, fout }: { status: Status; fout: string | null }) {
  const isFout = status === 'fout'
  return (
    <span
      role="status"
      title={fout ?? undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: '0.8125rem',
        color: isFout ? 'var(--waarschuwing)' : 'var(--text-muted)',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isFout
            ? 'var(--waarschuwing)'
            : status === 'bewaard'
              ? '#4f7d5c'
              : 'var(--text-muted)',
          opacity: status === 'schoon' ? 0.35 : 1,
        }}
      />
      {TEKST[status]}
    </span>
  )
}
