import { redirect } from 'next/navigation'
import { FileTextIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getCurrentUser, getReportExports } from '@/lib/supabase/queries'
import { DownloadReportButton } from '@/components/app/download-report-button'

export default async function ReportsPage() {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { data: reports } = await getReportExports(user.agency_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Exported PDF reports for your clients.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <FileTextIcon className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">No reports yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Run an audit and export it as a PDF to see reports here.
            </p>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Report History</CardTitle>
            <CardDescription>{reports.length} total reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.map((report) => {
                const clientName =
                  (report.clients as unknown as { name: string } | null)
                    ?.name ?? 'Unknown Client'
                const date = new Date(report.created_at).toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric', year: 'numeric' }
                )

                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileTextIcon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{report.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {clientName} &middot; {date}
                        </p>
                      </div>
                    </div>
                    <DownloadReportButton storagePath={report.storage_path} />
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
