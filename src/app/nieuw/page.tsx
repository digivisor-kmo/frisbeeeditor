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
    <main style={{ maxWidth: '58rem', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}
      >
        <h1 style={{ fontSize: '1.375rem', fontWeight: 600, margin: 0 }}>{nl.nieuw.titel}</h1>
        <Link href="/" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {nl.editor.terug}
        </Link>
      </div>

      <NieuwFormulier magBewerken={profile?.can_edit ?? false} />
    </main>
  )
}
