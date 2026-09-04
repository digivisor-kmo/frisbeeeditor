import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bibliotheek, type BibliotheekItem } from './Bibliotheek'
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
    .select('naam, email, can_edit')
    .eq('id', user.id)
    .single<Pick<Profile, 'naam' | 'email' | 'can_edit'>>()

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
    <main
      style={{
        maxWidth: '64rem',
        margin: '0 auto',
        padding: 'var(--ruimte-5) var(--ruimte-4) var(--ruimte-7)',
      }}
    >
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--ruimte-3)',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ruimte-3)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icoon.svg" alt="" width={36} height={36} style={{ borderRadius: 9 }} />
          <div>
            <h1 className="titel" style={{ fontSize: 'var(--tekst-lg)' }}>
              {nl.app.naam}
            </h1>
            <p className="stil">
              {profile?.naam ?? profile?.email ?? user.email} ·{' '}
              {magBewerken ? nl.rechten.trainer : nl.rechten.speler}
            </p>
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn--klein">
            {nl.login.afmelden}
          </button>
        </form>
      </header>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--ruimte-4)',
          margin: 'var(--ruimte-6) 0 var(--ruimte-3)',
        }}
      >
        <h2 className="kop">{nl.bibliotheek.titel}</h2>
        {magBewerken && (
          <Link href="/nieuw" className="btn btn--primair">
            {nl.bibliotheek.nieuw}
          </Link>
        )}
      </div>

      {lijst.length === 0 ? (
        <div
          className="kaart"
          style={{ padding: 'var(--ruimte-6)', textAlign: 'center', display: 'grid', gap: 'var(--ruimte-3)' }}
        >
          <p className="kop">{nl.bibliotheek.leegTitel}</p>
          <p className="stil" style={{ maxWidth: '28rem', margin: '0 auto' }}>
            {magBewerken ? nl.bibliotheek.leeg : nl.bibliotheek.leegSpeler}
          </p>
          {magBewerken && (
            <div>
              <Link href="/nieuw" className="btn btn--primair">
                {nl.bibliotheek.nieuw}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <Bibliotheek items={lijst} magBewerken={magBewerken} />
      )}

    </main>
  )
}
