import { LoginForm } from './LoginForm'
import { nl } from '@/lib/strings'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verder?: string; fout?: string }>
}) {
  const params = await searchParams
  const verder = params.verder?.startsWith('/') ? params.verder : '/'

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '1.5rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '24rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 600, margin: 0 }}>{nl.app.naam}</h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 1.5rem' }}>{nl.login.uitleg}</p>

        <div
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1.25rem',
          }}
        >
          {params.fout === 'link' && (
            <p
              role="alert"
              style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--team-b)' }}
            >
              {nl.login.linkVerlopen}
            </p>
          )}
          <LoginForm verder={verder} />
        </div>
      </div>
    </main>
  )
}
