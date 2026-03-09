import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
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

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
  if (!superAdminEmail || user.email !== superAdminEmail) {
    return NextResponse.json(
      { success: false, error: 'Access denied' },
      { status: 403 }
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('invites')
    .select('id, email, account_type, token, expires_at, used_at, created_at, invited_by_admin')
    .eq('invited_by_admin', true)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invites' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}

const revokeSchema = z.object({
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

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
  if (!superAdminEmail || user.email !== superAdminEmail) {
    return NextResponse.json(
      { success: false, error: 'Access denied' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const parsed = revokeSchema.safeParse({ id: searchParams.get('id') })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('invites')
    .update({
      expires_at: new Date(0).toISOString(),
    })
    .eq('id', parsed.data.id)

  if (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to revoke invite' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
