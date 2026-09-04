import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AppBalk } from '@/components/AppBalk'
import { Bibliotheek, type BibliotheekItem } from './Bibliotheek'
import { WachtwoordNudge } from './WachtwoordNudge'
import { frameContentSchema, type FrameContent } from '@/lib/diagram/schema'
import { createClient } from '@/lib/supabase/server'
import type { Json, Profile } from '@/lib/supabase/database.types'
import { nl } from '@/lib/strings'

interface Rij {
  id: string
  naam: string
  type: string | null
  categorie: string | null
  tags: string[] | null
  weergave: string
  draft: boolean
  favoriet: boolean
  gewijzigd_op: string
  frames: { volgorde: number; content: Json }[]
}

/** A frame straight from the database still has to pass the schema. */
function eersteFrame(rij: Rij): FrameContent | null {
  const frame = rij.frames.find((f) => f.volgorde === 0) ?? rij.frames[0]
  if (!frame) return null
  const resultaat = frameContentSchema.safeParse(frame.content)
  return resultaat.success ? resultaat.data : null
}

export default async function Home() {
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

  const { data: diagrammen } = await supabase
    .from('diagrams')
    .select(
      'id, naam, type, categorie, tags, weergave, draft, favoriet, gewijzigd_op, frames(volgorde, content)',
    )
    .order('gewijzigd_op', { ascending: false })
    .returns<Rij[]>()

  const magBewerken = profile?.can_edit ?? false
  const lijst: BibliotheekItem[] = (diagrammen ?? []).map((rij) => ({
    id: rij.id,
    naam: rij.naam,
    type: rij.type,
    categorie: rij.categorie,
    tags: rij.tags ?? [],
    weergave: rij.weergave,
    draft: rij.draft,
    favoriet: rij.favoriet,
    gewijzigd_op: rij.gewijzigd_op,
    voorbeeld: eersteFrame(rij),
  }))

  return (
    <>
      <AppBalk />

      <main className="pagina">
        {profile && !profile.heeft_wachtwoord && <WachtwoordNudge />}

        <div className="paginakop">
          <div>
            <h1 className="display">{nl.bibliotheek.titel}</h1>
            <p className="stil paginakop__onder">{nl.app.ondertitel}</p>
          </div>
          {magBewerken && (
            <Link href="/nieuw" className="btn btn--primair">
              {nl.bibliotheek.nieuw}
            </Link>
          )}
        </div>

        {lijst.length === 0 ? (
          <div className="kaart leeg-kaart">
            <p className="kop">{nl.bibliotheek.leegTitel}</p>
            <p className="stil" style={{ maxWidth: '30rem' }}>
              {magBewerken ? nl.bibliotheek.leeg : nl.bibliotheek.leegSpeler}
            </p>
            {magBewerken && (
              <Link href="/nieuw" className="btn btn--primair">
                {nl.bibliotheek.nieuw}
              </Link>
            )}
          </div>
        ) : (
          <Bibliotheek items={lijst} magBewerken={magBewerken} />
        )}
      </main>
    </>
  )
}
