import { redirect } from 'next/navigation'
import { getCurrentUser, getClients } from '@/lib/supabase/queries'
import { BlogAuditClient } from '@/components/app/blog-audit-client'

export default async function BlogAuditPage() {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { data: clients } = await getClients(user.agency_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Blog Audit</h1>
        <p className="text-sm text-muted-foreground">
          Audit any published blog URL for SEO quality and get actionable recommendations.
        </p>
      </div>
      <BlogAuditClient clients={clients} />
    </div>
  )
}
