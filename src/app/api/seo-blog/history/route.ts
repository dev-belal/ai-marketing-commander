import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    )
  }

  const { data: profile } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json(
      { success: false, error: 'Profile not found' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  let query = supabase
    .from('seo_blog_runs')
    .select('id, client_id, target_keyword, word_count, qa_score, qa_passed, status, created_at, clients(name)')
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}
