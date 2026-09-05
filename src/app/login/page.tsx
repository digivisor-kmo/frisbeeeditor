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
    <main className="inlog">
      <div className="inlog__kolom">
        <div className="merk inlog__merk">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icoon-192.png" alt="" width={36} height={36} className="merk__teken" />
          <span className="merk__naam" style={{ fontSize: 'var(--tekst-xl)' }}>
            {nl.app.naam}
          </span>
        </div>

        <h1 className="display inlog__kop">{nl.login.kop}</h1>
        <p className="stil inlog__onder">{nl.login.uitleg}</p>

        <div className="kaart inlog__kaart">
          {params.fout === 'link' && (
            <p role="alert" className="melding melding--fout">
              {nl.login.linkVerlopen}
            </p>
          )}
          <LoginForm verder={verder} />
        </div>

        <p className="inlog__voet stil">{nl.app.ondertitel}</p>
      </div>
    </main>
  )
}
