import { redirect } from 'next/navigation'
import { AppBalk } from '@/components/AppBalk'
import { Bibliotheek, type BibliotheekItem } from '@/app/Bibliotheek'
import { frameContentSchema, type FrameContent } from '@/lib/diagram/schema'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'
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

function eersteFrame(rij: Rij): FrameContent | null {
  const frame = rij.frames.find((f) => f.volgorde === 0) ?? rij.frames[0]
  if (!frame) return null
  const resultaat = frameContentSchema.safeParse(frame.content)
  return resultaat.success ? resultaat.data : null
}

/** The library as a player sees it: the same shelf, nothing you can change. */
export default async function SpelerBibliotheek() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: diagrammen } = await supabase
    .from('diagrams')
    .select(
      'id, naam, type, categorie, tags, weergave, draft, favoriet, gewijzigd_op, frames(volgorde, content)',
    )
    .order('gewijzigd_op', { ascending: false })
    .returns<Rij[]>()

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
        <div className="paginakop">
          <div>
            <h1 className="display">{nl.speler.titel}</h1>
            <p className="stil paginakop__onder">{nl.speler.uitleg}</p>
          </div>
        </div>

        {lijst.length === 0 ? (
          <div className="kaart leeg-kaart">
            <p className="kop">{nl.bibliotheek.leegTitel}</p>
            <p className="stil">{nl.bibliotheek.leegSpeler}</p>
          </div>
        ) : (
          <Bibliotheek items={lijst} magBewerken={false} basisPad="/speler" />
        )}
      </main>
    </>
  )
}
