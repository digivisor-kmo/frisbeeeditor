'use client'

import { useState } from 'react'
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
      <p style={{ margin: 0, lineHeight: 1.5 }}>
        {nl.login.verstuurd} <strong>{email}</strong>. {nl.login.verstuurdUitleg}
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
      <label htmlFor="email" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        {nl.login.emailLabel}
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="jij@voorbeeld.be"
        style={{
          font: 'inherit',
          fontSize: '1rem',
          padding: '0.75rem',
          minHeight: '44px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          background: 'var(--surface-raised)',
          color: 'var(--text)',
        }}
      />
      <button
        type="submit"
        disabled={status === 'bezig'}
        style={{
          font: 'inherit',
          fontWeight: 600,
          minHeight: '44px',
          padding: '0.75rem',
          borderRadius: 'var(--radius)',
          border: 'none',
          background: 'var(--accent)',
          color: 'var(--accent-contrast)',
          cursor: status === 'bezig' ? 'progress' : 'pointer',
          opacity: status === 'bezig' ? 0.7 : 1,
        }}
      >
        {status === 'bezig' ? nl.login.bezig : nl.login.knop}
      </button>
      {status === 'fout' && (
        <p role="alert" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--team-b)' }}>
          {nl.login.fout} {melding}
        </p>
      )}
    </form>
  )
}
