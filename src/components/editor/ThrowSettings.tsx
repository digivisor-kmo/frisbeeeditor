'use client'

import { Knop } from '@/components/ui/Knop'
import { THROW_LABELS, THROW_TYPES } from '@/lib/diagram/arrows'
import type { ThrowType } from '@/lib/diagram/schema'
import { nl } from '@/lib/strings'

interface Props {
  huidig: ThrowType
  onKies: (type: ThrowType) => void
}

export function ThrowSettings({ huidig, onKies }: Props) {
  return (
    <div>
      <span className="veld-label">{nl.menu.worptype}</span>
      {/* Five throws in a grid rather than a row: a segmented control this wide
          would run off a phone, and the names are what you pick on. */}
      <div className="keuzerij">
        {THROW_TYPES.map((type) => (
          <Knop key={type} klein actief={huidig === type} onClick={() => onKies(type)}>
            {THROW_LABELS[type]}
          </Knop>
        ))}
      </div>
      <p className="stil" style={{ fontSize: 'var(--tekst-xs)', marginTop: 'var(--ruimte-2)' }}>
        {nl.menu.worptypeUitleg}
      </p>
    </div>
  )
}
