import { redirect } from 'next/navigation'
import { Laden } from './Laden'
import { huidigeGebruiker } from '@/lib/supabase/gebruiker'

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gebruiker = await huidigeGebruiker()
  if (!gebruiker) redirect('/login')

  // A player has nothing to do here. Sending him to his own screen beats an
  // editor full of buttons he is not allowed to press.
  if (!gebruiker.magBewerken) redirect(`/speler/${id}`)

  return <Laden id={id} magBewerken />
}
