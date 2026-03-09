import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const deleteSchema = z.object({
  id: z.string().uuid(),
})

export async function DELETE(request: Request) {
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
    .select('agency_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json(
      { success: false, error: 'Profile not found' },
      { status: 401 }
    )
  }

  if (profile.role !== 'owner' && profile.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Only admins and owners can delete content' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const parsed = deleteSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // Fetch the row first to check storage path
  const { data: row } = await admin
    .from('content_generations')
    .select('id, creative_storage_path')
    .eq('id', parsed.data.id)
    .eq('agency_id', profile.agency_id)
    .single()

  if (!row) {
    return NextResponse.json(
      { success: false, error: 'Content not found' },
      { status: 404 }
    )
  }

  // Delete storage file if exists
  if (row.creative_storage_path) {
    await admin.storage
      .from('creatives')
      .remove([row.creative_storage_path])
  }

  const { error } = await admin
    .from('content_generations')
    .delete()
    .eq('id', parsed.data.id)
    .eq('agency_id', profile.agency_id)

  if (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
