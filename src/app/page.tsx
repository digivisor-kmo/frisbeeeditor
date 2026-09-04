import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { DiagramRow, Profile } from '@/lib/supabase/database.types'
import { nl } from '@/lib/strings'

type Rij = Pick<
  DiagramRow,
  'id' | 'naam' | 'type' | 'categorie' | 'weergave' | 'draft' | 'gewijzigd_op'
>

function datum(waarde: string): string {
  return new Date(waarde).toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

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

  const { data: diagrammen } = await supabase
    .from('diagrams')
    .select('id, naam, type, categorie, weergave, draft, gewijzigd_op')
    .order('gewijzigd_op', { ascending: false })
    .returns<Rij[]>()

  const magBewerken = profile?.can_edit ?? false
  const lijst = diagrammen ?? []

  return (
    <main style={{ maxWidth: '58rem', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
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
              minHeight: 44,
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

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginTop: '2rem',
          marginBottom: '0.75rem',
          gap: '1rem',
        }}
      >
        <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{nl.bibliotheek.titel}</h2>
        {magBewerken && (
          <Link
            href="/nieuw"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 44,
              padding: '0 1.125rem',
              borderRadius: 'var(--radius)',
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {nl.bibliotheek.nieuw}
          </Link>
        )}
      </div>

      {lijst.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{nl.bibliotheek.leeg}</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
          {lijst.map((diagram) => (
            <li key={diagram.id}>
              <Link
                href={`/editor/${diagram.id}`}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem 1rem',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  padding: '0.875rem 1rem',
                  minHeight: 44,
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  {diagram.naam.trim() === '' ? nl.bibliotheek.geenNaam : diagram.naam}
                  {diagram.draft && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        padding: '1px 5px',
                      }}
                    >
                      {nl.bibliotheek.concept}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {[diagram.type, diagram.categorie].filter(Boolean).join(' · ') || '—'} ·{' '}
                  {datum(diagram.gewijzigd_op)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
