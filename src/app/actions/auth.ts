'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTurnstile } from '@/lib/security/verify-turnstile'

export type AuthState = {
  error: string | null
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const agencyName = formData.get('agencyName') as string

  if (!email || !password || !agencyName) {
    return { error: 'All fields are required.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Something went wrong. Please try again.' }
  }

  const admin = createAdminClient()

  const { data: agency, error: agencyError } = await admin
    .from('agencies')
    .insert({
      name: agencyName,
      plan: 'free',
      onboarding_completed: false,
    })
    .select('id')
    .single()

  if (agencyError) {
    return { error: 'Failed to create agency. Please try again.' }
  }

  const { error: userError } = await admin.from('users').insert({
    id: authData.user.id,
    agency_id: agency.id,
    email,
    role: 'owner',
  })

  if (userError) {
    return { error: 'Failed to create user profile. Please try again.' }
  }

  redirect('/onboarding')
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const turnstileToken = formData.get('turnstileToken') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const turnstileValid = await verifyTurnstile(turnstileToken ?? '')
  if (!turnstileValid) {
    return { error: 'Security verification failed. Please try again.' }
  }

  const supabase = await createClient()

  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return { error: 'Invalid email or password.' }
  }

  const { data: user } = await supabase
    .from('users')
    .select('agency_id')
    .single()

  if (!user) {
    return { error: 'User profile not found. Please contact support.' }
  }

  const admin = createAdminClient()

  const { data: agency } = await admin
    .from('agencies')
    .select('onboarding_completed')
    .eq('id', user.agency_id)
    .single()

  if (!agency?.onboarding_completed) {
    redirect('/onboarding')
  }

  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
