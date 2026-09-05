import Link from 'next/link'
import { Leesscherm } from '@/components/speler/Leesscherm'
import { frameContentSchema } from '@/lib/diagram/schema'
import type { EditorDoc } from '@/lib/editor/document'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'
import { nl } from '@/lib/strings'

interface GedeeldFrame {
  id: string
  volgorde: number
  duur_ms: number
  toelichting: string | null
  content: Json
}

interface Gedeeld {
  id: string
  naam: string
  type: string | null
  categorie: string | null
  weergave: string
  tokenstijl: string
  frames: GedeeldFrame[]
}

/**
 * One diagram, without a login, for whoever has the link.
 *
 * Everything comes out of one database function: the anon role has no rights on
 * any table any more, so the token is the only key and there is no id in a URL
 * to guess at.
 */
export default async function GedeeldDiagram({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const { data } = await supabase.rpc('diagram_via_token', { p_token: token })
  const gedeeld = data as Gedeeld | null

  if (!gedeeld) {
    return (
      <main className="pagina pagina--smal">
        <div className="kaart leeg-kaart">
          <p className="kop">{nl.speler.verlopen}</p>
          <p className="stil">{nl.speler.verlopenUitleg}</p>
          <Link href="/login" className="btn">
            {nl.login.inloggen}
          </Link>
        </div>
      </main>
    )
  }

  const doc: EditorDoc = {
    id: gedeeld.id,
    meta: {
      naam: gedeeld.naam,
      type: (gedeeld.type as EditorDoc['meta']['type']) ?? null,
      categorie: gedeeld.categorie,
      niveau: null,
      tags: [],
      weergave: gedeeld.weergave as EditorDoc['meta']['weergave'],
      tokenstijl: gedeeld.tokenstijl as EditorDoc['meta']['tokenstijl'],
      draft: false,
    },
    frames: gedeeld.frames.map((frame) => ({
      id: frame.id,
      duurMs: frame.duur_ms,
      toelichting: frame.toelichting,
      content: frameContentSchema.parse(frame.content),
    })),
  }

  return (
    <>
      <header className="topbalk">
        <div className="topbalk__binnen">
          <div className="merk">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icoon-192.png" alt="" width={30} height={30} className="merk__teken" />
            <span className="merk__naam">{nl.app.naam}</span>
          </div>
          <span className="chip chip--stil">{nl.speler.gedeeld}</span>
        </div>
      </header>

      <main className="pagina lees-pagina">
        <div className="paginakop">
          <div>
            <h1 className="titel lees-naam">
              {doc.meta.naam.trim() === '' ? nl.bibliotheek.geenNaam : doc.meta.naam}
            </h1>
            <p className="stil">
              {[doc.meta.type, doc.meta.categorie].filter(Boolean).join(' · ') ||
                nl.speler.gedeeldUitleg}
            </p>
          </div>
        </div>

        <Leesscherm doc={doc} />
      </main>
    </>
  )
}
