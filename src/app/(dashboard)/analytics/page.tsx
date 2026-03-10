import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/queries'
import { canViewAnalytics, type Role } from '@/lib/permissions'
import { AnalyticsDashboard } from '@/components/app/analytics-dashboard'

export default async function AnalyticsPage() {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!canViewAnalytics(user.role as Role)) {
    redirect('/dashboard')
  }

  return <AnalyticsDashboard />
}