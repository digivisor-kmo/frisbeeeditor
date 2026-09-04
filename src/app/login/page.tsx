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
        padding: 'var(--ruimte-5) var(--ruimte-4)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '23rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ruimte-3)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icoon.svg" alt="" width={40} height={40} style={{ borderRadius: 10 }} />
          <div>
            <h1 className="titel" style={{ fontSize: 'var(--tekst-lg)' }}>
              {nl.app.naam}
            </h1>
            <p className="stil">{nl.app.ondertitel}</p>
          </div>
        </div>

        <div className="kaart" style={{ padding: 'var(--ruimte-4)', marginTop: 'var(--ruimte-5)' }}>
          <p style={{ marginBottom: 'var(--ruimte-4)' }} className="stil">
            {nl.login.uitleg}
          </p>
          {params.fout === 'link' && (
            <p
              role="alert"
              style={{
                marginBottom: 'var(--ruimte-3)',
                padding: 'var(--ruimte-2) var(--ruimte-3)',
                borderRadius: 'var(--radius)',
                background: 'var(--waarschuwing-zacht)',
                border: '1px solid var(--waarschuwing-rand)',
                color: 'var(--waarschuwing)',
                fontSize: 'var(--tekst-sm)',
              }}
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
