import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBetaInviteEmail } from '@/lib/email/send-invite'

const sendInviteSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(50),
  accountType: z.enum(['solo', 'team']),
  personalMessage: z.string().max(500).optional(),
})

export async function POST(request: Request) {
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

  const body = await request.json()
  const parsed = sendInviteSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { emails, accountType, personalMessage } = parsed.data
  const admin = createAdminClient()

  const results: { email: string; success: boolean; error?: string }[] = []

  for (const email of emails) {
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error: insertError } = await admin
      .from('invite_requests')
      .insert({
        email,
        name: email.split('@')[0],
        account_type: accountType,
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) {
      results.push({ email, success: false, error: 'Failed to create request' })
      continue
    }

    const { error: inviteError } = await admin
      .from('invites')
      .insert({
        email,
        token,
        account_type: accountType,
        expires_at: expiresAt,
        invited_by_admin: true,
      })

    if (inviteError) {
      results.push({ email, success: false, error: 'Failed to create invite' })
      continue
    }

    const { error: emailError } = await sendBetaInviteEmail({
      email,
      token,
      accountType,
      personalMessage: personalMessage ?? null,
    })

    if (emailError) {
      results.push({ email, success: false, error: emailError })
    } else {
      results.push({ email, success: true })
    }
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  return NextResponse.json({
    success: true,
    data: {
      sent: successCount,
      failed: failCount,
      results,
    },
  })
}
