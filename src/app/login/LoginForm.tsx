'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Knop } from '@/components/ui/Knop'
import { Invoer } from '@/components/ui/Veld'
import { createClient } from '@/lib/supabase/client'
import { nl } from '@/lib/strings'

type Modus = 'wachtwoord' | 'link' | 'verstuurd'
type Status = 'leeg' | 'bezig' | 'fout'

export function LoginForm({ verder }: { verder: string }) {
  const router = useRouter()
  const [modus, setModus] = useState<Modus>('wachtwoord')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [status, setStatus] = useState<Status>('leeg')
  const [melding, setMelding] = useState('')

  async function metWachtwoord(event: React.FormEvent) {
    event.preventDefault()
    setStatus('bezig')
    setMelding('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: wachtwoord,
    })

    if (error) {
      setStatus('fout')
      // Supabase cannot tell "wrong password" from "no password set", and for
      // this club the second is the likely one, so say both.
      setMelding(
        error.message.toLowerCase().includes('invalid login credentials')
          ? nl.login.verkeerd
          : `${nl.login.fout} ${error.message}`,
      )
      return
    }

    router.replace(verder)
    router.refresh()
  }

  async function metLink(event: React.FormEvent) {
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
      setMelding(`${nl.login.fout} ${error.message}`)
      return
    }
    setStatus('leeg')
    setModus('verstuurd')
  }

  if (modus === 'verstuurd') {
    return (
      <div style={{ display: 'grid', gap: 'var(--ruimte-2)', justifyItems: 'start' }}>
        <p style={{ fontWeight: 600 }}>{nl.login.verstuurd}</p>
        <p style={{ fontSize: 'var(--tekst-sm)', wordBreak: 'break-word' }}>{email}</p>
        <p className="stil">{nl.login.verstuurdUitleg}</p>
        <Knop klein onClick={() => setModus('wachtwoord')}>
          {nl.login.opnieuw}
        </Knop>
      </div>
    )
  }

  const metLinkModus = modus === 'link'

  return (
    <form
      onSubmit={metLinkModus ? metLink : metWachtwoord}
      style={{ display: 'grid', gap: 'var(--ruimte-3)' }}
    >
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

      {!metLinkModus && (
        <div>
          <label className="veld-label" htmlFor="wachtwoord">
            {nl.login.wachtwoordLabel}
          </label>
          <Invoer
            id="wachtwoord"
            type="password"
            required
            autoComplete="current-password"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
          />
        </div>
      )}

      <Knop type="submit" variant="primair" disabled={status === 'bezig'}>
        {status === 'bezig' ? nl.login.bezig : metLinkModus ? nl.login.knop : nl.login.inloggen}
      </Knop>

      {status === 'fout' && (
        <p role="alert" style={{ fontSize: 'var(--tekst-sm)', color: 'var(--waarschuwing)' }}>
          {melding}
        </p>
      )}

      <div style={{ display: 'grid', gap: 4, justifyItems: 'center' }}>
        <span className="stil">{metLinkModus ? '' : nl.login.linkUitleg}</span>
        <button
          type="button"
          className="tekstknop"
          onClick={() => {
            setStatus('leeg')
            setMelding('')
            setModus(metLinkModus ? 'wachtwoord' : 'link')
          }}
        >
          {metLinkModus ? nl.login.opnieuw : nl.login.knop}
        </button>
      </div>
    </form>
  )
}
