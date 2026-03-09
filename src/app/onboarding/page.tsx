import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { OnboardingWizard } from '@/components/app/onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const admin = createAdminClient()

  const { data: agency } = await admin
    .from('agencies')
    .select('name, onboarding_completed')
    .eq('id', profile.agency_id)
    .single()

  if (agency?.onboarding_completed) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-2xl">
        <OnboardingWizard agencyName={agency?.name ?? ''} agencyId={profile.agency_id} />
      </div>
    </div>
  )
}
