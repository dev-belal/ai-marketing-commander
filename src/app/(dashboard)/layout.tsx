import { redirect } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/components/app/app-sidebar'
import { DashboardHeader } from '@/components/app/dashboard-header'
import { getCurrentUser, getAgency } from '@/lib/supabase/queries'
import type { Role } from '@/lib/permissions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { data: agency } = await getAgency(user.agency_id)

  if (!agency) {
    redirect('/login')
  }

  if (!agency.onboarding_completed) {
    redirect('/onboarding')
  }

  return (
    <TooltipProvider>
      <SidebarProvider suppressHydrationWarning>
        <AppSidebar
          agencyName={agency.name}
          agencyLogoUrl={agency.logo_url}
          logoStatus={agency.logo_status ?? 'none'}
          role={user.role as Role}
          accountType={agency.account_type ?? 'solo'}
        />
        <SidebarInset className="max-h-svh overflow-hidden">
          <DashboardHeader
            userEmail={user.email}
            userName={user.full_name}
          />
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
