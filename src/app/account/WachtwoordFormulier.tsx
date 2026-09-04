'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Knop } from '@/components/ui/Knop'
import { Invoer } from '@/components/ui/Veld'
import { createClient } from '@/lib/supabase/client'
import { nl } from '@/lib/strings'

/** Short enough to type on a phone, long enough to be worth having. */
const MINIMUM = 8

export function WachtwoordFormulier() {
  const router = useRouter()
  const [nieuw, setNieuw] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [klaar, setKlaar] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFout(null)

    if (nieuw.length < MINIMUM) return setFout(nl.account.teKort)
    if (nieuw !== herhaal) return setFout(nl.account.verschillend)

    setBezig(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.updateUser({ password: nieuw })

    if (error || !data.user) {
      setBezig(false)
      setFout(`${nl.account.fout} ${error?.message ?? ''}`)
      return
    }

    // A flag for the interface only, so the app stops asking. The password
    // itself lives in Supabase Auth and never passes through this table.
    await supabase.from('profiles').update({ heeft_wachtwoord: true }).eq('id', data.user.id)

    setBezig(false)
    setNieuw('')
    setHerhaal('')
    setKlaar(true)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 'var(--ruimte-3)' }}>
      <div>
        <label className="veld-label" htmlFor="nieuw">
          {nl.account.nieuw}
        </label>
        <Invoer
          id="nieuw"
          type="password"
          required
          minLength={MINIMUM}
          autoComplete="new-password"
          value={nieuw}
          onChange={(e) => {
            setNieuw(e.target.value)
            setKlaar(false)
          }}
        />
        <p className="stil" style={{ marginTop: 4 }}>
          {nl.account.minimum}
        </p>
      </div>

      <div>
        <label className="veld-label" htmlFor="herhaal">
          {nl.account.herhaal}
        </label>
        <Invoer
          id="herhaal"
          type="password"
          required
          minLength={MINIMUM}
          autoComplete="new-password"
          value={herhaal}
          onChange={(e) => {
            setHerhaal(e.target.value)
            setKlaar(false)
          }}
        />
      </div>

      <div>
        <Knop type="submit" variant="primair" disabled={bezig}>
          {bezig ? nl.account.bezig : nl.account.bewaren}
        </Knop>
      </div>

      {fout && (
        <p role="alert" className="melding melding--fout" style={{ margin: 0 }}>
          {fout}
        </p>
      )}
      {klaar && (
        <p role="status" className="melding melding--goed" style={{ margin: 0 }}>
          {nl.account.bewaard}
        </p>
      )}
    </form>
  )
}
