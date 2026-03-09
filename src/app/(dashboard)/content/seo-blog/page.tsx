import { redirect } from 'next/navigation'
import { getCurrentUser, getClients } from '@/lib/supabase/queries'
import { SeoBlogClient } from '@/components/app/seo-blog-client'

export default async function SeoBlogPage() {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { data: clients } = await getClients(user.agency_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">SEO Blog Generator</h1>
        <p className="text-sm text-muted-foreground">
          Research &rarr; Outline &rarr; Write &rarr; QA &rarr; Schema
        </p>
      </div>
      <SeoBlogClient clients={clients} />
    </div>
  )
}
