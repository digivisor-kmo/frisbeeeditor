import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Where the magic link lands. Supabase sends either a PKCE `code` or a
 * `token_hash`, depending on the mail template, so both are handled.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const verder = searchParams.get('verder') ?? '/'
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${verder}`)
    return NextResponse.redirect(`${origin}/login?fout=link`)
  }

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type: 'email', token_hash: tokenHash })
    if (!error) return NextResponse.redirect(`${origin}${verder}`)
  }

  return NextResponse.redirect(`${origin}/login?fout=link`)
}
