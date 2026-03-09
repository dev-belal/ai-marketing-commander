'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AcceptInviteState = {
  error: string | null
}

export async function acceptInvite(
  _prevState: AcceptInviteState,
  formData: FormData
): Promise<AcceptInviteState> {
  const token = formData.get('token') as string
  const name = formData.get('name') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!token || !name || !password) {
    return { error: 'All fields are required.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const admin = createAdminClient()

  // Fetch the invite
  const { data: invite, error: inviteError } = await admin
    .from('invites')
    .select('id, email, account_type, used_at, expires_at, request_id')
    .eq('token', token)
    .single()

  if (inviteError || !invite) {
    return { error: 'Invalid invite link.' }
  }

  if (invite.used_at) {
    return { error: 'This invite has already been used.' }
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'This invite has expired. Please request access again.' }
  }

  // Check if this is a team member invite
  let isTeamInvite = false
  let teamAgencyId: string | null = null
  let teamRole: string | null = null
  let companyName = name

  if (invite.request_id) {
    const { data: request } = await admin
      .from('invite_requests')
      .select('company, invited_by, assigned_role')
      .eq('id', invite.request_id)
      .single()

    if (request) {
      if (request.invited_by) {
        isTeamInvite = true
        teamAgencyId = request.invited_by
        teamRole = request.assigned_role ?? 'member'
      }
      if (request.company) {
        companyName = request.company
      }
    }
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { error: 'Failed to create account. Please try again.' }
  }

  if (isTeamInvite && teamAgencyId) {
    // Team member invite — join existing agency
    const { error: userError } = await admin.from('users').insert({
      id: authData.user.id,
      agency_id: teamAgencyId,
      email: invite.email,
      full_name: name,
      role: teamRole,
    })

    if (userError) {
      return { error: 'Failed to create user profile. Please try again.' }
    }
  } else {
    // Agency owner invite — create new agency
    const { data: agency, error: agencyError } = await admin
      .from('agencies')
      .insert({
        name: companyName,
        account_type: invite.account_type,
        plan: 'free',
        onboarding_completed: false,
      })
      .select('id')
      .single()

    if (agencyError || !agency) {
      return { error: 'Failed to create agency. Please try again.' }
    }

    const { error: userError } = await admin.from('users').insert({
      id: authData.user.id,
      agency_id: agency.id,
      email: invite.email,
      full_name: name,
      role: 'owner',
    })

    if (userError) {
      return { error: 'Failed to create user profile. Please try again.' }
    }
  }

  // Mark invite as used
  await admin
    .from('invites')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invite.id)

  // Sign in the new user
  const supabase = await createClient()
  await supabase.auth.signInWithPassword({
    email: invite.email,
    password,
  })

  // Team members skip onboarding, agency owners go to onboarding
  if (isTeamInvite) {
    redirect('/dashboard')
  }

  redirect('/onboarding')
}
