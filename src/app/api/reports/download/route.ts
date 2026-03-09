import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const requestSchema = z.object({
  storagePath: z.string().min(1),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
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
      { success: false, error: 'User profile not found.' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request data.' },
      { status: 400 }
    )
  }

  const { storagePath } = parsed.data

  // Verify the storage path starts with the user's agency ID
  if (!storagePath.startsWith(profile.agency_id)) {
    return NextResponse.json(
      { success: false, error: 'Access denied.' },
      { status: 403 }
    )
  }

  const admin = createAdminClient()

  const { data: signedUrlData, error: urlError } = await admin.storage
    .from('reports')
    .createSignedUrl(storagePath, 3600)

  if (urlError || !signedUrlData?.signedUrl) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate download link.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: { url: signedUrlData.signedUrl },
  })
}
