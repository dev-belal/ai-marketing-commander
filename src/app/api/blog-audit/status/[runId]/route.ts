import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params

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

  const { data: run, error } = await supabase
    .from('blog_audit_runs')
    .select('*')
    .eq('id', runId)
    .eq('agency_id', profile.agency_id)
    .single()

  if (error || !run) {
    return NextResponse.json(
      { success: false, error: 'Run not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: run })
}
