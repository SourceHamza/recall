import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Google sends people back here with ?code=... — swap it for a session, then go home.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/`)
  }
  return NextResponse.redirect(`${origin}/welcome?error=auth`)
}
