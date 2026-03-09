import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  UsersIcon,
  SearchIcon,
  PenToolIcon,
  FileTextIcon,
  PlusIcon,
  PlayIcon,
  SparklesIcon,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCurrentUser, getDashboardStats, getRecentAuditRuns } from '@/lib/supabase/queries'

export default async function DashboardPage() {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const [stats, { data: recentAudits }] = await Promise.all([
    getDashboardStats(user.agency_id),
    getRecentAuditRuns(user.agency_id),
  ])

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: UsersIcon,
    },
    {
      title: 'Audits Run',
      value: stats.auditsRun,
      icon: SearchIcon,
    },
    {
      title: 'Content Generated',
      value: stats.contentGenerated,
      icon: PenToolIcon,
    },
    {
      title: 'Reports Exported',
      value: stats.reportsExported,
      icon: FileTextIcon,
    },
  ]

  if (stats.totalClients === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <UsersIcon className="size-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">No clients yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first client to start running audits and generating content.
          </p>
        </div>
        <Link href="/clients">
          <Button>
            <PlusIcon />
            <span>Add Your First Client</span>
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Your agency at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{stat.title}</CardDescription>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Audits</CardTitle>
            <CardDescription>
              Last {recentAudits.length} audit runs across all clients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAudits.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No audits run yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentAudits.map((audit) => (
                  <div
                    key={audit.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {(audit.clients as unknown as { name: string } | null)?.name ?? 'Unknown Client'}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {audit.type} audit
                      </p>
                    </div>
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/clients">
              <Button variant="outline" className="w-full justify-start">
                <PlusIcon />
                <span>Add Client</span>
              </Button>
            </Link>
            <Link href="/audits">
              <Button variant="outline" className="w-full justify-start">
                <PlayIcon />
                <span>Run Audit</span>
              </Button>
            </Link>
            <Link href="/content">
              <Button variant="outline" className="w-full justify-start">
                <SparklesIcon />
                <span>Generate Content</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
