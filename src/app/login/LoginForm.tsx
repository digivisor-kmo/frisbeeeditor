'use client'

import { useState } from 'react'
import { Knop } from '@/components/ui/Knop'
import { Invoer } from '@/components/ui/Veld'
import { createClient } from '@/lib/supabase/client'
import { nl } from '@/lib/strings'

type Status = 'leeg' | 'bezig' | 'verstuurd' | 'fout'

export function LoginForm({ verder }: { verder: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('leeg')
  const [melding, setMelding] = useState('')

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus('bezig')
    setMelding('')

    const supabase = createClient()
    const redirect = new URL('/auth/callback', window.location.origin)
    redirect.searchParams.set('verder', verder)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirect.toString() },
    })

    if (error) {
      setStatus('fout')
      setMelding(error.message)
      return
    }
    setStatus('verstuurd')
  }

  if (status === 'verstuurd') {
    return (
      <div style={{ display: 'grid', gap: 'var(--ruimte-2)' }}>
        <p style={{ fontWeight: 600 }}>{nl.login.verstuurd}</p>
        <p style={{ fontSize: 'var(--tekst-sm)', wordBreak: 'break-word' }}>{email}</p>
        <p className="stil">{nl.login.verstuurdUitleg}</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 'var(--ruimte-3)' }}>
      <div>
        <label className="veld-label" htmlFor="email">
          {nl.login.emailLabel}
        </label>
        <Invoer
          id="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jij@voorbeeld.be"
        />
      </div>

      <Knop type="submit" variant="primair" disabled={status === 'bezig'}>
        {status === 'bezig' ? nl.login.bezig : nl.login.knop}
      </Knop>

      {status === 'fout' && (
        <p role="alert" style={{ fontSize: 'var(--tekst-sm)', color: 'var(--waarschuwing)' }}>
          {nl.login.fout} {melding}
        </p>
      )}
    </form>
  )
}
