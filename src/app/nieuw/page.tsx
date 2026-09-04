import { redirect } from 'next/navigation'
import { AppBalk } from '@/components/AppBalk'
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
    <>
      <AppBalk />
      <main className="pagina pagina--smal">
        <div className="paginakop">
          <div>
            <h1 className="display">{nl.nieuw.titel}</h1>
            <p className="stil paginakop__onder">{nl.nieuw.uitleg}</p>
          </div>
        </div>

        <NieuwFormulier magBewerken={profile?.can_edit ?? false} />
      </main>
    </>
  )
}
