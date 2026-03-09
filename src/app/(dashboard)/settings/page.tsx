import { redirect } from 'next/navigation'
import { getCurrentUser, getAgency, getTeamMembers } from '@/lib/supabase/queries'
import { canViewSettings, isTeamAccount, type Role } from '@/lib/permissions'
import { SettingsBrandingForm } from '@/components/app/settings-branding-form'
import { SettingsAccount } from '@/components/app/settings-account'
import { SettingsTeam } from '@/components/app/settings-team'

export default async function SettingsPage() {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const role = user.role as Role

  if (!canViewSettings(role)) {
    redirect('/dashboard')
  }

  const { data: agency } = await getAgency(user.agency_id)

  if (!agency) {
    redirect('/dashboard')
  }

  const showTeamTab = isTeamAccount(agency.account_type ?? 'solo')

  let members: Awaited<ReturnType<typeof getTeamMembers>>['data'] = []
  if (showTeamTab) {
    const { data } = await getTeamMembers(user.agency_id)
    members = data
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your agency settings and preferences.
        </p>
      </div>
      <SettingsPageTabs
        agency={{
          id: agency.id,
          name: agency.name,
          logoUrl: agency.logo_url,
          logoPendingUrl: agency.logo_pending_url ?? null,
          logoOriginalUrl: agency.logo_original_url ?? null,
          logoStatus: agency.logo_status ?? 'none',
          websiteUrl: agency.website_url ?? '',
          primaryColor: agency.primary_color ?? '#000000',
          accountType: agency.account_type ?? 'solo',
          plan: agency.plan,
          createdAt: agency.created_at,
        }}
        role={role}
        showTeamTab={showTeamTab}
        members={members}
        currentUserId={user.id}
      />
    </div>
  )
}

// Thin client wrapper for tabs — keeps page as server component
import { SettingsTabsWrapper } from '@/components/app/settings-tabs-wrapper'

function SettingsPageTabs(props: {
  agency: {
    id: string
    name: string
    logoUrl: string | null
    logoPendingUrl: string | null
    logoOriginalUrl: string | null
    logoStatus: string
    websiteUrl: string
    primaryColor: string
    accountType: string
    plan: string
    createdAt: string
  }
  role: Role
  showTeamTab: boolean
  members: { id: string; email: string; full_name: string | null; role: string; created_at: string }[]
  currentUserId: string
}) {
  return <SettingsTabsWrapper {...props} />
}
