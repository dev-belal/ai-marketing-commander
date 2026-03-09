import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SearchIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getCurrentUser, getAuditRuns } from '@/lib/supabase/queries'

export default async function AuditsPage() {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { data: audits } = await getAuditRuns(user.agency_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audits</h1>
          <p className="text-sm text-muted-foreground">
            Marketing audits across all clients.
          </p>
        </div>
        <Link href="/audits/new">
          <Button>Run New Audit</Button>
        </Link>
      </div>

      {audits.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <SearchIcon className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">No audits yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Run your first marketing audit to get actionable insights.
            </p>
          </div>
          <Link href="/audits/new">
            <Button>Run New Audit</Button>
          </Link>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Audit History</CardTitle>
            <CardDescription>{audits.length} total audit runs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {audits.map((audit) => {
                const clientName =
                  (audit.clients as unknown as { name: string } | null)?.name ??
                  'Unknown Client'
                const date = new Date(audit.created_at).toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric', year: 'numeric' }
                )

                return (
                  <div
                    key={audit.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{clientName}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {audit.type} audit &middot; {date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          audit.status === 'completed'
                            ? 'default'
                            : audit.status === 'running'
                              ? 'secondary'
                              : audit.status === 'failed'
                                ? 'destructive'
                                : 'outline'
                        }
                      >
                        {audit.status}
                      </Badge>
                      {audit.status === 'completed' && (
                        <Link href={`/audits/${audit.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
