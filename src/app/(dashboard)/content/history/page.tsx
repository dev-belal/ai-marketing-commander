import { redirect } from 'next/navigation'
import { getCurrentUser, getClients } from '@/lib/supabase/queries'
import { ContentHistory } from '@/components/app/content-history'

export default async function ContentHistoryPage() {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { data: clients } = await getClients(user.agency_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Content History</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all generated content
        </p>
      </div>
      <ContentHistory clients={clients} userRole={user.role} />
    </div>
  )
}
