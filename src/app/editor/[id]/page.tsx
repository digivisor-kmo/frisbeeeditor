import { redirect } from 'next/navigation'
import { Laden } from './Laden'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/database.types'

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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

  // A player has nothing to do here. Sending him to his own screen beats an
  // editor full of buttons he is not allowed to press.
  if (!profile?.can_edit) redirect(`/speler/${id}`)

  return <Laden id={id} magBewerken />
}
