import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/queries'
import { canViewAnalytics, type Role } from '@/lib/permissions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  BarChart3Icon,
  FileTextIcon,
  PenToolIcon,
  SearchIcon,
  TrendingUpIcon,
} from 'lucide-react'

export default async function AnalyticsPage() {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!canViewAnalytics(user.role as Role)) {
    redirect('/dashboard')
  }

  const placeholders = [
    {
      title: 'Total Audits Run',
      description: 'Audits completed by month',
      icon: SearchIcon,
    },
    {
      title: 'Content Generated',
      description: 'Breakdown by content type',
      icon: PenToolIcon,
    },
    {
      title: 'Reports Exported',
      description: 'PDF reports delivered to clients',
      icon: FileTextIcon,
    },
    {
      title: 'Most Active Client',
      description: 'Client with the most activity',
      icon: TrendingUpIcon,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track your agency&apos;s performance metrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {placeholders.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <item.icon className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                <BarChart3Icon className="size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
