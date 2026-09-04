import { redirect } from 'next/navigation'
import { FieldCanvas } from '@/components/field/FieldCanvas'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/database.types'
import { nl } from '@/lib/strings'

const views = [
  { kind: 'volledig' as const, naam: nl.veld.volledig, uitleg: nl.veld.volledigUitleg },
  { kind: 'half' as const, naam: nl.veld.half, uitleg: nl.veld.halfUitleg },
  { kind: 'vrij' as const, naam: nl.veld.vrij, uitleg: nl.veld.vrijUitleg },
]

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('naam, email, can_edit')
    .eq('id', user.id)
    .single<Pick<Profile, 'naam' | 'email' | 'can_edit'>>()

  const magBewerken = profile?.can_edit ?? false

  return (
    <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 600, margin: 0 }}>{nl.app.naam}</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            {profile?.naam ?? profile?.email ?? user.email} ·{' '}
            {magBewerken ? nl.rechten.trainer : nl.rechten.speler}
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            style={{
              font: 'inherit',
              fontSize: '0.875rem',
              minHeight: '44px',
              padding: '0 1rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface-raised)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            {nl.login.afmelden}
          </button>
        </form>
      </header>

      {!magBewerken && (
        <p
          style={{
            marginTop: '1.25rem',
            padding: '0.75rem 1rem',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
          }}
        >
          {nl.rechten.spelerUitleg}
        </p>
      )}

      <p
        style={{
          marginTop: '1.25rem',
          padding: '0.75rem 1rem',
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
        }}
      >
        <strong style={{ color: 'var(--text)' }}>{nl.bouw.stap}</strong> {nl.bouw.toelichting}
      </p>

      <div style={{ display: 'grid', gap: '2rem', marginTop: '2rem' }}>
        {views.map((v) => (
          <section key={v.kind}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.125rem' }}>{v.naam}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 0.75rem' }}>
              {v.uitleg}
            </p>
            <div
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '0.5rem',
                maxWidth: v.kind === 'half' ? '22rem' : undefined,
              }}
            >
              <FieldCanvas kind={v.kind} />
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
