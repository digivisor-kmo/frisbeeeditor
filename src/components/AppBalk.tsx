import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/database.types'
import { AccountMenu } from '@/components/AccountMenu'
import { nl } from '@/lib/strings'

/**
 * The bar every signed-in screen wears.
 *
 * One component rather than three copies: the moment the header lives in three
 * places it starts drifting, and a header that is almost the same on every page
 * is exactly what makes an application feel homemade.
 *
 * Two things sit in it and nothing else: what this is, and who you are.
 * Everything you can do with your account is folded behind the second one.
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
          <img src="/icoon-192.png" alt="" width={30} height={30} className="merk__teken" />
          <span className="merk__naam">{nl.app.naam}</span>
        </Link>

        <AccountMenu
          naam={profile?.naam ?? profile?.email ?? user.email ?? ''}
          email={profile?.email ?? user.email ?? ''}
          magBewerken={profile?.can_edit ?? false}
        />
      </div>
    </header>
  )
}
