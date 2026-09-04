import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/database.types'
import { nl } from '@/lib/strings'
import { NieuwFormulier } from './NieuwFormulier'

export default async function NieuwPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('can_edit')
    .eq('id', user.id)
    .single<Pick<Profile, 'can_edit'>>()

  return (
    <main
      style={{
        maxWidth: '58rem',
        margin: '0 auto',
        padding: 'var(--ruimte-5) var(--ruimte-4) var(--ruimte-7)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--ruimte-3)',
          marginBottom: 'var(--ruimte-5)',
        }}
      >
        <h1 className="titel" style={{ fontSize: 'var(--tekst-lg)' }}>
          {nl.nieuw.titel}
        </h1>
        <Link href="/" className="btn btn--klein">
          {nl.editor.terug}
        </Link>
      </div>

      <NieuwFormulier magBewerken={profile?.can_edit ?? false} />
    </main>
  )
}
