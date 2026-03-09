'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canManageTeamMembers, type Role } from '@/lib/permissions'

async function getAuthedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, agency_id, role')
    .eq('id', user.id)
    .single()

  return profile
}

export type TeamActionState = {
  error: string | null
  success: boolean
}

export async function inviteTeamMember(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const email = formData.get('email') as string
  const assignedRole = formData.get('role') as string

  if (!email || !assignedRole) {
    return { error: 'Email and role are required.', success: false }
  }

  if (!['lead', 'member'].includes(assignedRole)) {
    return { error: 'Invalid role.', success: false }
  }

  const user = await getAuthedUser()
  if (!user || !canManageTeamMembers(user.role as Role)) {
    return { error: 'Access denied.', success: false }
  }

  const admin = createAdminClient()

  // Check if email is already a user in this agency
  const { data: existingUser } = await admin
    .from('users')
    .select('id')
    .eq('email', email)
    .eq('agency_id', user.agency_id)
    .single()

  if (existingUser) {
    return { error: 'This person is already a team member.', success: false }
  }

  // Check for existing pending invite request
  const { data: existingRequest } = await admin
    .from('invite_requests')
    .select('id, status')
    .eq('email', email)
    .eq('invited_by', user.agency_id)
    .single()

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      return { error: 'An invite request for this email is already pending.', success: false }
    }
    // Delete old rejected request
    if (existingRequest.status === 'rejected') {
      await admin.from('invite_requests').delete().eq('id', existingRequest.id)
    }
  }

  // Get agency name for the request
  const { data: agency } = await admin
    .from('agencies')
    .select('name')
    .eq('id', user.agency_id)
    .single()

  const { error: insertError } = await admin.from('invite_requests').insert({
    name: email.split('@')[0],
    email,
    account_type: 'team',
    company: agency?.name ?? null,
    reason: `Team member invite (${assignedRole})`,
    invited_by: user.agency_id,
    assigned_role: assignedRole,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'An invite request for this email already exists.', success: false }
    }
    return { error: 'Failed to submit invite request.', success: false }
  }

  revalidatePath('/team')
  return { error: null, success: true }
}

export async function changeTeamMemberRole(
  memberId: string,
  newRole: string
): Promise<{ error: string | null }> {
  if (!['lead', 'member'].includes(newRole)) {
    return { error: 'Invalid role.' }
  }

  const user = await getAuthedUser()
  if (!user || !canManageTeamMembers(user.role as Role)) {
    return { error: 'Access denied.' }
  }

  const admin = createAdminClient()

  // Can't change own role
  if (memberId === user.id) {
    return { error: 'You cannot change your own role.' }
  }

  // Verify member belongs to same agency
  const { data: member } = await admin
    .from('users')
    .select('id, role, agency_id')
    .eq('id', memberId)
    .single()

  if (!member || member.agency_id !== user.agency_id) {
    return { error: 'Member not found.' }
  }

  // Can't change owner role
  if (member.role === 'owner') {
    return { error: 'Cannot change the owner role.' }
  }

  const { error } = await admin
    .from('users')
    .update({ role: newRole })
    .eq('id', memberId)

  if (error) {
    return { error: 'Failed to update role.' }
  }

  revalidatePath('/team')
  return { error: null }
}

export async function removeTeamMember(
  memberId: string
): Promise<{ error: string | null }> {
  const user = await getAuthedUser()
  if (!user || !canManageTeamMembers(user.role as Role)) {
    return { error: 'Access denied.' }
  }

  if (memberId === user.id) {
    return { error: 'You cannot remove yourself.' }
  }

  const admin = createAdminClient()

  const { data: member } = await admin
    .from('users')
    .select('id, role, agency_id')
    .eq('id', memberId)
    .single()

  if (!member || member.agency_id !== user.agency_id) {
    return { error: 'Member not found.' }
  }

  if (member.role === 'owner') {
    return { error: 'Cannot remove the owner.' }
  }

  // Delete the user profile (auth user remains but loses access)
  const { error } = await admin
    .from('users')
    .delete()
    .eq('id', memberId)

  if (error) {
    return { error: 'Failed to remove member.' }
  }

  revalidatePath('/team')
  return { error: null }
}
