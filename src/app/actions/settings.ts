'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canViewSettings, canManageTeamMembers, type Role } from '@/lib/permissions'

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

export type SettingsActionState = {
  error: string | null
  success: boolean
}

export async function updateAgencyBranding(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const user = await getAuthedUser()
  if (!user || !canViewSettings(user.role as Role)) {
    return { error: 'Access denied.', success: false }
  }

  const name = formData.get('name') as string
  const websiteUrl = formData.get('websiteUrl') as string
  const primaryColor = formData.get('primaryColor') as string
  const logoOriginalUrl = formData.get('logoOriginalUrl') as string
  const logoPendingUrl = formData.get('logoPendingUrl') as string

  if (!name?.trim()) {
    return { error: 'Agency name is required.', success: false }
  }

  const admin = createAdminClient()

  const updateData: Record<string, string | null> = {
    name: name.trim(),
    website_url: websiteUrl?.trim() || null,
    primary_color: primaryColor || '#000000',
  }

  // If new logo uploaded, set to pending approval
  if (logoPendingUrl) {
    updateData.logo_original_url = logoOriginalUrl || null
    updateData.logo_pending_url = logoPendingUrl
    updateData.logo_status = 'pending'
    updateData.logo_url = null
  }

  const { error } = await admin
    .from('agencies')
    .update(updateData)
    .eq('id', user.agency_id)

  if (error) {
    return { error: 'Failed to update branding.', success: false }
  }

  revalidatePath('/settings')
  return { error: null, success: true }
}

export async function deleteAgency(
  agencyName: string
): Promise<{ error: string | null }> {
  const user = await getAuthedUser()
  if (!user || user.role !== 'owner') {
    return { error: 'Only the agency owner can delete the agency.' }
  }

  const admin = createAdminClient()

  // Verify agency name matches
  const { data: agency } = await admin
    .from('agencies')
    .select('id, name')
    .eq('id', user.agency_id)
    .single()

  if (!agency || agency.name !== agencyName) {
    return { error: 'Agency name does not match.' }
  }

  // Delete all users in the agency from auth
  const { data: users } = await admin
    .from('users')
    .select('id')
    .eq('agency_id', user.agency_id)

  if (users) {
    for (const u of users) {
      await admin.auth.admin.deleteUser(u.id)
    }
  }

  // Delete the agency (cascades to users, clients, etc.)
  const { error } = await admin
    .from('agencies')
    .delete()
    .eq('id', user.agency_id)

  if (error) {
    return { error: 'Failed to delete agency.' }
  }

  // Sign out
  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect('/login')
}

export async function updateMemberRole(
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

  if (memberId === user.id) {
    return { error: 'You cannot change your own role.' }
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
    return { error: 'Cannot change the owner role.' }
  }

  const { error } = await admin
    .from('users')
    .update({ role: newRole })
    .eq('id', memberId)

  if (error) {
    return { error: 'Failed to update role.' }
  }

  revalidatePath('/settings')
  return { error: null }
}

export async function removeMember(
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

  const { error } = await admin
    .from('users')
    .delete()
    .eq('id', memberId)

  if (error) {
    return { error: 'Failed to remove member.' }
  }

  revalidatePath('/settings')
  return { error: null }
}
