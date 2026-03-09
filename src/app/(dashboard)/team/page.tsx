import { redirect } from 'next/navigation'
import { getCurrentUser, getTeamMembers } from '@/lib/supabase/queries'
import { canViewTeamPage, type Role } from '@/lib/permissions'
import { TeamDashboard } from '@/components/app/team-dashboard'

export default async function TeamPage() {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const role = user.role as Role

  if (!canViewTeamPage(role)) {
    redirect('/dashboard')
  }

  const { data: members } = await getTeamMembers(user.agency_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground">
          Manage your team members and roles.
        </p>
      </div>
      <TeamDashboard members={members} currentUserId={user.id} />
    </div>
  )
}
