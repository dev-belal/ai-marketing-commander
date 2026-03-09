'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendInviteEmail } from '@/lib/email/send-invite'

async function verifySuperAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  return user.email === process.env.SUPER_ADMIN_EMAIL
}

export async function approveRequest(requestId: string): Promise<{ error: string | null }> {
  if (!(await verifySuperAdmin())) {
    return { error: 'Access denied.' }
  }

  const admin = createAdminClient()

  const { data: request, error: fetchError } = await admin
    .from('invite_requests')
    .select('id, name, email, account_type, status, invited_by, assigned_role')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) {
    return { error: 'Request not found.' }
  }

  if (request.status !== 'pending') {
    return { error: 'Request has already been processed.' }
  }

  // Create invite
  const { data: invite, error: inviteError } = await admin
    .from('invites')
    .insert({
      request_id: request.id,
      email: request.email,
      account_type: request.account_type,
    })
    .select('token')
    .single()

  if (inviteError || !invite) {
    return { error: 'Failed to create invite.' }
  }

  // Update request status
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? ''
  await admin
    .from('invite_requests')
    .update({
      status: 'approved',
      reviewed_by: superAdminEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  // Send invite email
  const { error: emailError } = await sendInviteEmail({
    email: request.email,
    name: request.name,
    token: invite.token,
    accountType: request.account_type,
  })

  if (emailError) {
    // Invite was created but email failed — don't fail the whole operation
    console.error('Failed to send invite email:', emailError)
  }

  revalidatePath('/admin')
  return { error: null }
}

export async function rejectRequest(requestId: string): Promise<{ error: string | null }> {
  if (!(await verifySuperAdmin())) {
    return { error: 'Access denied.' }
  }

  const admin = createAdminClient()
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? ''

  const { error } = await admin
    .from('invite_requests')
    .update({
      status: 'rejected',
      reviewed_by: superAdminEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', 'pending')

  if (error) {
    return { error: 'Failed to reject request.' }
  }

  revalidatePath('/admin')
  return { error: null }
}

export async function suspendAgency(agencyId: string): Promise<{ error: string | null }> {
  if (!(await verifySuperAdmin())) {
    return { error: 'Access denied.' }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('agencies')
    .update({ status: 'suspended' })
    .eq('id', agencyId)

  if (error) {
    return { error: 'Failed to suspend agency.' }
  }

  revalidatePath('/admin')
  return { error: null }
}

export async function approveLogo(agencyId: string): Promise<{ error: string | null }> {
  if (!(await verifySuperAdmin())) {
    return { error: 'Access denied.' }
  }

  const admin = createAdminClient()

  const { data: agency } = await admin
    .from('agencies')
    .select('logo_pending_url')
    .eq('id', agencyId)
    .single()

  if (!agency?.logo_pending_url) {
    return { error: 'No pending logo found.' }
  }

  const { error } = await admin
    .from('agencies')
    .update({
      logo_url: agency.logo_pending_url,
      logo_status: 'approved',
    })
    .eq('id', agencyId)

  if (error) {
    return { error: 'Failed to approve logo.' }
  }

  revalidatePath('/admin')
  return { error: null }
}

export async function rejectLogo(agencyId: string): Promise<{ error: string | null }> {
  if (!(await verifySuperAdmin())) {
    return { error: 'Access denied.' }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('agencies')
    .update({
      logo_pending_url: null,
      logo_status: 'rejected',
    })
    .eq('id', agencyId)

  if (error) {
    return { error: 'Failed to reject logo.' }
  }

  revalidatePath('/admin')
  return { error: null }
}

export async function reactivateAgency(agencyId: string): Promise<{ error: string | null }> {
  if (!(await verifySuperAdmin())) {
    return { error: 'Access denied.' }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('agencies')
    .update({ status: 'active' })
    .eq('id', agencyId)

  if (error) {
    return { error: 'Failed to reactivate agency.' }
  }

  revalidatePath('/admin')
  return { error: null }
}
