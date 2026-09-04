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

const KLEUR: Record<Status, string> = {
  schoon: 'var(--text-faint)',
  wachtend: 'var(--text-muted)',
  bezig: 'var(--text-muted)',
  bewaard: 'var(--goed)',
  fout: 'var(--waarschuwing)',
}

export function BewaarStatusLabel({ status, fout }: { status: Status; fout: string | null }) {
  return (
    <span
      role="status"
      className="bewaarstatus"
      title={fout ?? TEKST[status]}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 'var(--tekst-sm)',
        color: status === 'fout' ? 'var(--waarschuwing)' : 'var(--text-muted)',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden
        style={{ width: 7, height: 7, borderRadius: '50%', background: KLEUR[status], flexShrink: 0 }}
      />
      <span className="bewaarstatus__tekst">{TEKST[status]}</span>
    </span>
  )
}
