import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user has completed onboarding
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: settings } = await supabase
          .from('settings')
          .select('onboarding_complete')
          .eq('user_id', session.user.id)
          .single()

        if (!settings?.onboarding_complete) {
          return NextResponse.redirect(new URL('/onboarding', request.url))
        }
      }
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/login?error=auth-callback-failed', request.url))
}
