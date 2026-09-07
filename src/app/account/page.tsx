import { redirect } from 'next/navigation'
import { AppBalk } from '@/components/AppBalk'
import { WachtwoordFormulier } from './WachtwoordFormulier'
import { huidigeGebruiker } from '@/lib/supabase/gebruiker'
import { nl } from '@/lib/strings'

export default async function AccountPagina() {
  const gebruiker = await huidigeGebruiker()
  if (!gebruiker) redirect('/login')
  const profile = gebruiker.profiel

  return (
    <>
      <AppBalk />
      <main className="pagina pagina--smal">
        <div className="paginakop">
          <div>
            <h1 className="display">{nl.account.titel}</h1>
            <p className="stil paginakop__onder">
              {profile?.naam ?? profile?.email ?? gebruiker.email} ·{' '}
              {profile?.can_edit ? nl.rechten.trainer : nl.rechten.speler}
            </p>
          </div>
        </div>

        <section className="kaart" style={{ padding: 'var(--ruimte-5)' }}>
          <h2 className="kop">{nl.account.wachtwoordTitel}</h2>
          <p className="stil" style={{ margin: 'var(--ruimte-2) 0 var(--ruimte-4)' }}>
            {nl.account.wachtwoordUitleg}
          </p>
          <WachtwoordFormulier />
        </section>

        <section className="kaart" style={{ padding: 'var(--ruimte-5)', marginTop: 'var(--ruimte-4)' }}>
          <h2 className="kop">{nl.account.afmeldenTitel}</h2>
          <p className="stil" style={{ margin: 'var(--ruimte-2) 0 var(--ruimte-4)' }}>
            {nl.account.afmeldenUitleg}
          </p>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn">
              {nl.login.afmelden}
            </button>
          </form>
        </section>
      </main>
    </>
  )
}
