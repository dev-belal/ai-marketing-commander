import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  LightbulbIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCurrentUser, getAuditRunWithResults } from '@/lib/supabase/queries'
import { ExportPdfButton } from '@/components/app/export-pdf-button'

const DIMENSION_LABELS: Record<string, string> = {
  seo: 'SEO',
  content: 'Content',
  technical: 'Technical',
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { data: audit } = await getAuditRunWithResults(id, user.agency_id)

  if (!audit) {
    notFound()
  }

  const clientInfo = audit.clients as unknown as {
    name: string
    website_url: string | null
  } | null

  const results = audit.results ?? []
  const overallScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + (r.score ?? 0), 0) / results.length
        )
      : 0

  const date = new Date(audit.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/audits">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeftIcon />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">
            {clientInfo?.name ?? 'Unknown Client'} — {audit.type.charAt(0).toUpperCase() + audit.type.slice(1)} Audit
          </h1>
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
        <div className="flex items-center gap-2">
          {audit.status === 'completed' && (
            <ExportPdfButton auditRunId={audit.id} />
          )}
          <Badge
            variant={
              audit.status === 'completed'
                ? 'default'
                : audit.status === 'failed'
                  ? 'destructive'
                  : 'secondary'
            }
          >
            {audit.status}
          </Badge>
        </div>
      </div>

      {audit.status !== 'completed' ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {audit.status === 'running'
                ? 'Audit is still running. Refresh the page to check for updates.'
                : 'This audit failed to complete.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Overall Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${scoreColor(overallScore)}`}>
                  {overallScore}
                  <span className="text-base font-normal text-muted-foreground">
                    /100
                  </span>
                </div>
                <Progress value={overallScore} className="mt-2" />
              </CardContent>
            </Card>
            {results.map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <CardDescription>
                    {DIMENSION_LABELS[r.dimension] ?? r.dimension}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-3xl font-bold ${scoreColor(r.score ?? 0)}`}
                  >
                    {r.score ?? 0}
                    <span className="text-base font-normal text-muted-foreground">
                      /100
                    </span>
                  </div>
                  <Progress value={r.score ?? 0} className="mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {results.length > 0 && (
            <Tabs defaultValue={results[0].dimension}>
              <TabsList>
                {results.map((r) => (
                  <TabsTrigger key={r.dimension} value={r.dimension}>
                    {DIMENSION_LABELS[r.dimension] ?? r.dimension}
                  </TabsTrigger>
                ))}
              </TabsList>

              {results.map((r) => {
                const findings = Array.isArray(r.findings)
                  ? (r.findings as string[])
                  : []
                const recommendations = Array.isArray(r.recommendations)
                  ? (r.recommendations as string[])
                  : []

                return (
                  <TabsContent key={r.dimension} value={r.dimension}>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertTriangleIcon className="size-4 text-yellow-500" />
                            Findings
                          </CardTitle>
                          <CardDescription>
                            {findings.length} issues identified
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {findings.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No findings.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {findings.map((finding, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                    {i + 1}
                                  </span>
                                  <span>{finding}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <LightbulbIcon className="size-4 text-blue-500" />
                            Recommendations
                          </CardTitle>
                          <CardDescription>
                            {recommendations.length} action items
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {recommendations.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No recommendations.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {recommendations.map((rec, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-blue-500" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          )}
        </>
      )}
    </div>
  )
}
