'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type OnboardingState = {
  error: string | null
}

type OnboardingData = {
  agencyName: string
  logoOriginalUrl: string | null
  logoPendingUrl: string | null
}

export async function completeOnboarding(
  data: OnboardingData
): Promise<OnboardingState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: 'User profile not found.' }
  }

  const admin = createAdminClient()
  const agencyId = profile.agency_id

  const hasLogo = !!data.logoPendingUrl

  const { error: agencyUpdateError } = await admin
    .from('agencies')
    .update({
      name: data.agencyName,
      logo_url: null,
      logo_original_url: data.logoOriginalUrl,
      logo_pending_url: data.logoPendingUrl,
      logo_status: hasLogo ? 'pending' : 'none',
      onboarding_completed: true,
    })
    .eq('id', agencyId)

  if (agencyUpdateError) {
    return { error: 'Failed to update agency details.' }
  }

  redirect('/dashboard')
}
