import Link from 'next/link'
import { redirect } from 'next/navigation'
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
    <main style={{ maxWidth: '32rem', margin: '0 auto', padding: 'var(--ruimte-5) var(--ruimte-4)' }}>
      <Link href="/" className="tekstknop">
        ‹ {nl.account.terug}
      </Link>

      <h1 className="titel" style={{ fontSize: 'var(--tekst-lg)', margin: 'var(--ruimte-4) 0 2px' }}>
        {nl.account.titel}
      </h1>
      <p className="stil">
        {profile?.naam ?? profile?.email ?? user.email} ·{' '}
        {profile?.can_edit ? nl.rechten.trainer : nl.rechten.speler}
      </p>

      <section className="kaart" style={{ padding: 'var(--ruimte-4)', marginTop: 'var(--ruimte-5)' }}>
        <h2 className="kop">{nl.account.wachtwoordTitel}</h2>
        <p className="stil" style={{ margin: 'var(--ruimte-2) 0 var(--ruimte-4)' }}>
          {nl.account.wachtwoordUitleg}
        </p>
        <WachtwoordFormulier />
      </section>
    </main>
  )
}
