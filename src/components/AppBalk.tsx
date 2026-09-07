import Link from 'next/link'
import { AccountMenu } from '@/components/AccountMenu'
import { huidigeGebruiker } from '@/lib/supabase/gebruiker'
import { nl } from '@/lib/strings'

/**
 * The bar every signed-in screen wears.
 *
 * One component rather than three copies: the moment the header lives in three
 * places it starts drifting, and a header that is almost the same on every page
 * is exactly what makes an application feel homemade.
 *
 * Two things sit in it and nothing else: what this is, and who you are.
 * Everything you can do with your account is folded behind the second one. Who
 * you are comes from the shared per-request lookup, so wearing this bar costs
 * the page nothing.
 */
export async function AppBalk() {
  const gebruiker = await huidigeGebruiker()
  if (!gebruiker) return null

  return (
    <header className="topbalk">
      <div className="topbalk__binnen">
        <Link href="/" className="merk">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icoon-192.png" alt="" width={30} height={30} className="merk__teken" />
          <span className="merk__naam">{nl.app.naam}</span>
        </Link>

        <AccountMenu
          naam={gebruiker.profiel?.naam ?? gebruiker.profiel?.email ?? gebruiker.email ?? ''}
          email={gebruiker.profiel?.email ?? gebruiker.email ?? ''}
          magBewerken={gebruiker.magBewerken}
        />
      </div>
    </header>
  )
}
