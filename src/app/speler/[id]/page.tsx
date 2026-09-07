import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AppBalk } from '@/components/AppBalk'
import { Leesscherm } from '@/components/speler/Leesscherm'
import { frameContentSchema } from '@/lib/diagram/schema'
import type { EditorDoc } from '@/lib/editor/document'
import { createClient } from '@/lib/supabase/server'
import { huidigeGebruiker } from '@/lib/supabase/gebruiker'
import type { DiagramRow, FrameRow } from '@/lib/supabase/database.types'
import { nl } from '@/lib/strings'

export default async function SpelerDiagram({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Three questions that do not wait on each other: who you are, which diagram
  // this is, and what is in it. Asked one after the other they were three
  // crossings to Frankfurt for one screen.
  const [gebruiker, { data: diagram }, { data: frames }] = await Promise.all([
    huidigeGebruiker(),
    supabase.from('diagrams').select('*').eq('id', id).single<DiagramRow>(),
    supabase
      .from('frames')
      .select('*')
      .eq('diagram_id', id)
      .order('volgorde', { ascending: true })
      .returns<FrameRow[]>(),
  ])

  if (!gebruiker) redirect('/login')
  if (!diagram) notFound()
  const profile = gebruiker.profiel

  const doc: EditorDoc = {
    id: diagram.id,
    meta: {
      naam: diagram.naam,
      type: (diagram.type as EditorDoc['meta']['type']) ?? null,
      categorie: diagram.categorie,
      niveau: diagram.niveau,
      tags: diagram.tags ?? [],
      weergave: diagram.weergave as EditorDoc['meta']['weergave'],
      tokenstijl: diagram.tokenstijl as EditorDoc['meta']['tokenstijl'],
      draft: diagram.draft,
    },
    frames: (frames ?? []).map((frame) => ({
      id: frame.id,
      duurMs: frame.duur_ms,
      toelichting: frame.toelichting,
      content: frameContentSchema.parse(frame.content),
    })),
  }

  return (
    <>
      <AppBalk />
      <main className="pagina lees-pagina">
        <div className="paginakop">
          <div>
            <Link href="/speler" className="tekstknop">
              ‹ {nl.speler.terug}
            </Link>
            <h1 className="titel lees-naam">
              {doc.meta.naam.trim() === '' ? nl.bibliotheek.geenNaam : doc.meta.naam}
            </h1>
            <p className="stil">
              {[doc.meta.type, doc.meta.categorie].filter(Boolean).join(' · ')}
            </p>
          </div>
          {profile?.can_edit && (
            <Link href={`/editor/${id}`} className="btn btn--klein">
              {nl.speler.bewerken}
            </Link>
          )}
        </div>

        <Leesscherm doc={doc} />
      </main>
    </>
  )
}
