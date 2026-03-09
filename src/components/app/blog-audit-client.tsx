'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { BlogAuditProgress } from './blog-audit-progress'
import { BlogAuditResult, type AuditResultData } from './blog-audit-result'
import { LoaderIcon, SearchIcon } from 'lucide-react'
import type { AuditCheck, AuditCategory } from '@/types/blog-audit'

type Client = {
  id: string
  name: string
  website_url: string | null
}

type HistoryItem = {
  id: string
  client_id: string | null
  page_url: string
  target_keyword: string
  overall_score: number | null
  status: string
  created_at: string
  clients: { name: string } | null
}

type BlogAuditClientProps = {
  clients: Client[]
}

type Mode = 'client' | 'standalone'

function getGrade(score: number): string {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function BlogAuditClient({ clients }: BlogAuditClientProps) {
  const [mode, setMode] = useState<Mode>('client')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [pageUrl, setPageUrl] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [isStarting, setIsStarting] = useState(false)

  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [resultData, setResultData] = useState<AuditResultData | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    if (mode === 'client' && selectedClientId) {
      fetchHistory(selectedClientId)
    } else if (mode === 'standalone') {
      fetchHistory(null)
    } else {
      setHistory([])
    }
  }, [selectedClientId, mode])

  async function fetchHistory(clientId: string | null) {
    try {
      const url = clientId
        ? `/api/blog-audit/history?clientId=${clientId}`
        : '/api/blog-audit/history'
      const res = await fetch(url)
      const json = await res.json()
      if (json.success) {
        setHistory(json.data)
      }
    } catch {
      // silently fail
    }
  }

  async function handleStart() {
    if (mode === 'client' && !selectedClientId) {
      toast.error('Please select a client')
      return
    }
    if (!pageUrl.trim() || !targetKeyword.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsStarting(true)
    setResultData(null)

    try {
      const res = await fetch('/api/blog-audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: mode === 'client' ? selectedClientId : null,
          pageUrl: pageUrl.trim(),
          targetKeyword: targetKeyword.trim(),
        }),
      })

      const json = await res.json()

      if (!json.success) {
        toast.error(json.error ?? 'Failed to start audit')
        return
      }

      setActiveRunId(json.data.runId)
    } catch {
      toast.error('Network error')
    } finally {
      setIsStarting(false)
    }
  }

  const handleAuditComplete = useCallback(async () => {
    if (!activeRunId) return

    try {
      const res = await fetch(`/api/blog-audit/status/${activeRunId}`)
      const json = await res.json()

      if (json.success) {
        const run = json.data
        setResultData(mapRunToResult(run))
        setActiveRunId(null)

        if (mode === 'client' && selectedClientId) {
          fetchHistory(selectedClientId)
        } else if (mode === 'standalone') {
          fetchHistory(null)
        }
      }
    } catch {
      // handled by progress component
    }
  }, [activeRunId, selectedClientId, mode])

  async function handleLoadRun(runId: string) {
    try {
      const res = await fetch(`/api/blog-audit/status/${runId}`)
      const json = await res.json()

      if (json.success) {
        const run = json.data

        if (run.status !== 'complete') {
          setActiveRunId(runId)
          setResultData(null)
          return
        }

        setResultData(mapRunToResult(run))
        setActiveRunId(null)
      }
    } catch {
      toast.error('Failed to load audit')
    }
  }

  function handleReaudit() {
    setResultData(null)
    handleStart()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* LEFT COLUMN */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SearchIcon className="size-4 text-primary" />
              Blog Audit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode toggle */}
            <div className="flex rounded-full border p-0.5">
              <button
                type="button"
                onClick={() => setMode('client')}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'client'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                For a Client
              </button>
              <button
                type="button"
                onClick={() => setMode('standalone')}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'standalone'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Standalone
              </button>
            </div>

            {mode === 'client' && (
              <div className="space-y-2">
                <Label htmlFor="audit-client">Client</Label>
                <select
                  id="audit-client"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="audit-url">Blog Page URL</Label>
              <Input
                id="audit-url"
                type="url"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                placeholder="https://example.com/blog/my-post"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audit-keyword">Target Keyword</Label>
              <Input
                id="audit-keyword"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="e.g. best seo tools for agencies"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleStart}
              disabled={isStarting || !!activeRunId || (mode === 'client' && !selectedClientId)}
            >
              {isStarting ? (
                <>
                  <LoaderIcon className="size-4 animate-spin" />
                  Starting...
                </>
              ) : activeRunId ? (
                'Audit Running...'
              ) : (
                'Run Audit'
              )}
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              Estimated time: ~10-20 seconds
            </p>
          </CardContent>
        </Card>

        {/* Recent audits */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Audits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.slice(0, 5).map((item) => {
                  const date = new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })

                  const score = item.overall_score ?? 0
                  const scoreColor =
                    score >= 85 ? 'default' as const :
                    score >= 70 ? 'secondary' as const :
                    'destructive' as const

                  let urlDisplay: string
                  try {
                    const u = new URL(item.page_url)
                    urlDisplay = u.pathname.length > 30
                      ? u.pathname.slice(0, 30) + '...'
                      : u.pathname
                  } catch {
                    urlDisplay = item.page_url.slice(0, 30)
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleLoadRun(item.id)}
                      className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <p className="truncate text-sm font-medium">
                            {item.target_keyword}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.clients?.name ?? 'Standalone'}
                            {' · '}
                            {date}
                            {' · '}
                            {urlDisplay}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {item.overall_score !== null && item.status === 'complete' && (
                            <>
                              <Badge variant={scoreColor} className="text-[10px]">
                                {item.overall_score}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {getGrade(item.overall_score)}
                              </Badge>
                            </>
                          )}
                          {item.status !== 'complete' && (
                            <Badge
                              variant={item.status === 'failed' ? 'destructive' : 'secondary'}
                              className="text-[10px]"
                            >
                              {item.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div>
        {!activeRunId && !resultData && (
          <Card>
            <CardContent className="flex min-h-[400px] items-center justify-center py-12">
              <div className="text-center space-y-2">
                <SearchIcon className="mx-auto size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Enter a blog URL and target keyword to audit its SEO quality.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeRunId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Running</CardTitle>
            </CardHeader>
            <CardContent>
              <BlogAuditProgress
                runId={activeRunId}
                onComplete={handleAuditComplete}
              />
            </CardContent>
          </Card>
        )}

        {resultData && (
          <BlogAuditResult data={resultData} onReaudit={handleReaudit} />
        )}
      </div>
    </div>
  )
}

function mapRunToResult(run: Record<string, unknown>): AuditResultData {
  const score = (run.overall_score as number) ?? 0
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F'

  // Reconstruct categories from the stored data
  // The API returns flat fields; we rebuild categories for display
  const categories = reconstructCategories(run)

  return {
    pageUrl: run.page_url as string,
    targetKeyword: run.target_keyword as string,
    overallScore: score,
    grade,
    categories,
    priorityFixes: (run.priority_fixes as AuditCheck[]) ?? [],
    recommendations: (run.recommendations as string) ?? '',
    stats: {
      wordCount: (run.word_count as number) ?? 0,
      keywordCount: (run.keyword_count as number) ?? 0,
      keywordDensity: run.word_count
        ? `${(((run.keyword_count as number) ?? 0) / ((run.word_count as number) ?? 1) * 100).toFixed(1)}%`
        : '0.0%',
      h1Count: 1,
      h2Count: (run.h2_count as number) ?? 0,
      h3Count: (run.h3_count as number) ?? 0,
      internalLinks: (run.internal_link_count as number) ?? 0,
      externalLinks: (run.external_link_count as number) ?? 0,
      images: (run.image_count as number) ?? 0,
      imagesMissingAlt: (run.images_missing_alt as number) ?? 0,
      hasSchema: (run.has_schema as boolean) ?? false,
      schemaType: (run.schema_type as string | null) ?? null,
      hasCanonical: (run.has_canonical as boolean) ?? false,
    },
    createdAt: run.created_at as string,
  }
}

function reconstructCategories(run: Record<string, unknown>): AuditCategory[] {
  // Since we store qa_issues (all non-passing checks) and flat stats,
  // rebuild category structure from the stored issues
  const allIssues = (run.qa_issues as AuditCheck[]) ?? []

  // Group issues by their code prefix to approximate categories
  const catMap: Record<string, { checks: AuditCheck[]; score: number; maxScore: number }> = {
    'on-page-seo': { checks: [], score: 0, maxScore: 30 },
    'content-quality': { checks: [], score: 0, maxScore: 25 },
    'technical-seo': { checks: [], score: 0, maxScore: 20 },
    'links': { checks: [], score: 0, maxScore: 15 },
    'media': { checks: [], score: 0, maxScore: 10 },
  }

  const codeToCategory: Record<string, string> = {
    TITLE_KW: 'on-page-seo', H1_KW: 'on-page-seo', META_KW: 'on-page-seo',
    INTRO_KW: 'on-page-seo', H2_KW: 'on-page-seo', URL_KW: 'on-page-seo',
    WORD_COUNT: 'content-quality', H2_COUNT: 'content-quality',
    H3_PRESENT: 'content-quality', HAS_CTA: 'content-quality',
    HAS_CANONICAL: 'technical-seo', HAS_SCHEMA: 'technical-seo',
    SCHEMA_TYPE: 'technical-seo', SINGLE_H1: 'technical-seo',
    INT_LINKS_1: 'links', INT_LINKS_2: 'links', EXT_LINKS: 'links',
    HAS_IMAGES: 'media', IMG_ALT: 'media',
  }

  for (const issue of allIssues) {
    const catId = codeToCategory[issue.code] ?? 'on-page-seo'
    if (catMap[catId]) {
      catMap[catId].checks.push(issue)
    }
  }

  // Approximate scores from overall score distribution
  const overall = (run.overall_score as number) ?? 0
  // Simple: distribute proportionally, then adjust by failed checks
  const totalMax = 100
  for (const [, cat] of Object.entries(catMap)) {
    const failedCount = cat.checks.filter((c) => c.status === 'fail').length
    const warningCount = cat.checks.filter((c) => c.status === 'warning').length
    const totalChecks = cat.checks.length
    // If no issues stored for category, assume full score
    if (totalChecks === 0) {
      cat.score = cat.maxScore
    } else {
      const perCheck = cat.maxScore / (totalChecks + (cat.maxScore / 5))
      cat.score = Math.max(0, Math.round(cat.maxScore - failedCount * perCheck - warningCount * (perCheck * 0.5)))
    }
  }

  // Adjust to match overall
  const catTotal = Object.values(catMap).reduce((s, c) => s + c.score, 0)
  if (catTotal !== overall && catTotal > 0) {
    const ratio = overall / catTotal
    for (const cat of Object.values(catMap)) {
      cat.score = Math.min(cat.maxScore, Math.round(cat.score * ratio))
    }
  }

  const labels: Record<string, string> = {
    'on-page-seo': 'On-Page SEO',
    'content-quality': 'Content Quality',
    'technical-seo': 'Technical SEO',
    'links': 'Links',
    'media': 'Media & Accessibility',
  }

  return Object.entries(catMap).map(([id, cat]) => ({
    id,
    label: labels[id] ?? id,
    score: cat.score,
    maxScore: cat.maxScore,
    checks: cat.checks,
  }))
}

export { BlogAuditClient }
