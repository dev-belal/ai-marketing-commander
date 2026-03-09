import { redirect } from 'next/navigation'
import { getCurrentUser, getClients } from '@/lib/supabase/queries'
import { NewAuditForm } from '@/components/app/new-audit-form'

export default async function NewAuditPage() {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { data: clients } = await getClients(user.agency_id)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Run New Audit</h1>
        <p className="text-sm text-muted-foreground">
          Select a client and audit type to begin.
        </p>
      </div>
      <NewAuditForm clients={clients} />
    </div>
  )
}
