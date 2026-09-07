import { redirect } from 'next/navigation'
import { AppBalk } from '@/components/AppBalk'
import { huidigeGebruiker } from '@/lib/supabase/gebruiker'
import { nl } from '@/lib/strings'
import { NieuwFormulier } from './NieuwFormulier'

export default async function NieuwPage() {
  const gebruiker = await huidigeGebruiker()
  if (!gebruiker) redirect('/login')

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

        <NieuwFormulier magBewerken={gebruiker.magBewerken} />
      </main>
    </>
  )
}
