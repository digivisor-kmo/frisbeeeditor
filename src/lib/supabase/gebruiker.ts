import { cache } from 'react'
import { createClient } from './server'
import type { Profile } from './database.types'

export type Profiel = Pick<Profile, 'naam' | 'email' | 'can_edit' | 'heeft_wachtwoord'>

export interface Aangemeld {
  id: string
  email: string | null
  profiel: Profiel | null
  magBewerken: boolean
}

/**
 * Who is asking, looked up once per request.
 *
 * Every screen wants this, and so does the bar on top of it. Without the cache
 * a single page load asked the auth server who you were twice and read your
 * profile twice — four round trips to the database for one answer, one after
 * the other, before a single pixel could be sent.
 *
 * React's `cache` scopes to one request, so the bar and the page share the
 * lookup and a second visitor never sees somebody else's answer.
 */
export const huidigeGebruiker = cache(async (): Promise<Aangemeld | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profiel } = await supabase
    .from('profiles')
    .select('naam, email, can_edit, heeft_wachtwoord')
    .eq('id', user.id)
    .single<Profiel>()

  return {
    id: user.id,
    email: user.email ?? null,
    profiel: profiel ?? null,
    magBewerken: profiel?.can_edit ?? false,
  }
})
