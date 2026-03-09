'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type RequestAccessState = {
  error: string | null
  success: boolean
}

export async function requestAccess(
  _prevState: RequestAccessState,
  formData: FormData
): Promise<RequestAccessState> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const accountType = formData.get('accountType') as string
  const company = formData.get('company') as string
  const reason = formData.get('reason') as string

  if (!name || !email || !accountType) {
    return { error: 'Name, email, and account type are required.', success: false }
  }

  if (!['solo', 'team'].includes(accountType)) {
    return { error: 'Invalid account type.', success: false }
  }

  const admin = createAdminClient()

  // Check for existing request
  const { data: existing } = await admin
    .from('invite_requests')
    .select('id, status')
    .eq('email', email)
    .single()

  if (existing) {
    if (existing.status === 'pending') {
      return { error: 'A request is already pending review for this email.', success: false }
    }
    if (existing.status === 'approved') {
      return { error: 'This email has already been approved. Check your inbox for an invite link.', success: false }
    }
    if (existing.status === 'rejected') {
      await admin.from('invite_requests').delete().eq('id', existing.id)
    }
  }

  const { error: insertError } = await admin.from('invite_requests').insert({
    name,
    email,
    account_type: accountType,
    company: company || null,
    reason: reason || null,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'A request with this email already exists.', success: false }
    }
    return { error: 'Failed to submit request. Please try again.', success: false }
  }

  return { error: null, success: true }
}
