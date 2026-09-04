import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/database.types'
import { PersoonIcon } from '@/components/editor/icons'
import { nl } from '@/lib/strings'

/**
 * The bar every signed-in screen wears.
 *
 * One component rather than three copies: the moment the header lives in three
 * places it starts drifting, and a header that is almost the same on every page
 * is exactly what makes an application feel homemade.
 */
export async function AppBalk() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('naam, email, can_edit')
    .eq('id', user.id)
    .single<Pick<Profile, 'naam' | 'email' | 'can_edit'>>()

  return (
    <header className="topbalk">
      <div className="topbalk__binnen">
        <Link href="/" className="merk">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icoon.svg" alt="" width={30} height={30} className="merk__teken" />
          <span className="merk__naam">{nl.app.naam}</span>
        </Link>

        <div className="topbalk__rechts">
          <span className="topbalk__wie">
            {profile?.naam ?? profile?.email ?? user.email}
            <span className="topbalk__rol">
              {profile?.can_edit ? nl.rechten.trainer : nl.rechten.speler}
            </span>
          </span>

          {/*
            On a phone two words plus two more words do not fit next to the
            name of the app, and they were landing on top of it. One icon leads
            to the account page, and signing out lives there.
          */}
          <Link
            href="/account"
            className="btn btn--klein btn--icoon topbalk__account"
            aria-label={nl.account.titel}
            title={nl.account.titel}
          >
            <PersoonIcon />
          </Link>

          <Link href="/account" className="btn btn--klein topbalk__breed">
            {nl.account.titel}
          </Link>
          <form action="/auth/signout" method="post" className="topbalk__breed">
            <button type="submit" className="btn btn--klein">
              {nl.login.afmelden}
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
