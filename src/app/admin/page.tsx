import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminDashboard } from '@/components/app/admin-dashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    redirect('/admin/login')
  }

  const admin = createAdminClient()

  const [requestsResult, agenciesResult, invitesResult, pendingLogosResult] = await Promise.all([
    admin
      .from('invite_requests')
      .select('id, name, email, account_type, company, reason, status, reviewed_at, created_at, invited_by, assigned_role')
      .order('created_at', { ascending: false }),
    admin
      .from('agencies')
      .select('id, name, account_type, status, plan, created_at')
      .order('created_at', { ascending: false }),
    admin
      .from('invites')
      .select('id, email, account_type, token, expires_at, used_at, created_at')
      .order('created_at', { ascending: false }),
    admin
      .from('agencies')
      .select('id, name, logo_original_url, logo_pending_url')
      .eq('logo_status', 'pending'),
  ])

  // Build a map of agency names for team member invites
  const agencyMap: Record<string, string> = {}
  for (const agency of agenciesResult.data ?? []) {
    agencyMap[agency.id] = agency.name
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage access requests, users, and invites
          </p>
        </div>
        <AdminDashboard
          requests={requestsResult.data ?? []}
          agencies={agenciesResult.data ?? []}
          invites={invitesResult.data ?? []}
          agencyMap={agencyMap}
          pendingLogos={pendingLogosResult.data ?? []}
        />
      </div>
    </div>
  )
}
