import { redirect } from 'next/navigation'
import { AppBalk } from '@/components/AppBalk'
import { WachtwoordFormulier } from './WachtwoordFormulier'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/database.types'
import { nl } from '@/lib/strings'

export default async function AccountPagina() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('naam, email, can_edit, heeft_wachtwoord')
    .eq('id', user.id)
    .single<Pick<Profile, 'naam' | 'email' | 'can_edit' | 'heeft_wachtwoord'>>()

  return (
    <>
      <AppBalk />
      <main className="pagina pagina--smal">
        <div className="paginakop">
          <div>
            <h1 className="display">{nl.account.titel}</h1>
            <p className="stil paginakop__onder">
              {profile?.naam ?? profile?.email ?? user.email} ·{' '}
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
      </main>
    </>
  )
}
