import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'app_session_token'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Admin route protection
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    if (user.email !== process.env.SUPER_ADMIN_EMAIL) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  const isProtectedRoute = pathname.startsWith('/dashboard')
  const isAuthRoute = pathname === '/login' || pathname === '/signup'

  // Not logged in and trying to access protected route → redirect to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged in and trying to access auth pages → redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Concurrent session enforcement for team accounts on protected routes
  if (user && isProtectedRoute) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get user's agency to check account_type
    const { data: profile } = await admin
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (profile) {
      const { data: agency } = await admin
        .from('agencies')
        .select('account_type')
        .eq('id', profile.agency_id)
        .single()

      if (agency?.account_type === 'team') {
        const existingToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
        let sessionToken = existingToken

        if (!sessionToken) {
          sessionToken = crypto.randomUUID()
        }

        // Check active session for this user
        const { data: activeSession } = await admin
          .from('active_sessions')
          .select('id, session_token')
          .eq('user_id', user.id)
          .single()

        if (activeSession) {
          if (activeSession.session_token !== sessionToken) {
            // Different session detected — this is the OLD session being kicked
            // Sign out and redirect
            await supabase.auth.signOut()
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('reason', 'session_replaced')
            return NextResponse.redirect(url)
          }

          // Same session — update last_seen_at
          await admin
            .from('active_sessions')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', activeSession.id)
        } else {
          // No active session — create one
          await admin.from('active_sessions').upsert(
            {
              user_id: user.id,
              agency_id: profile.agency_id,
              session_token: sessionToken,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
        }

        // Set the session cookie on the response
        if (!existingToken) {
          supabaseResponse.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
          })
        }
      }
    }
  }

  return supabaseResponse
}
