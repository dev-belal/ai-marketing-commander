import { redirect } from 'next/navigation'
import { getCurrentUser, getClients } from '@/lib/supabase/queries'
import { ContentGenerator } from '@/components/app/content-generator'

export default async function ContentGeneratePage() {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { data: clients } = await getClients(user.agency_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Content Generator</h1>
        <p className="text-sm text-muted-foreground">
          Generate SEO pages, ad copy, emails, and social content with brand context
        </p>
      </div>
      <ContentGenerator clients={clients} />
    </div>
  )
}
