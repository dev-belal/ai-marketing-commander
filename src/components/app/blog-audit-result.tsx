'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  CheckCircle2Icon,
  XCircleIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  ClipboardIcon,
  ChevronDownIcon,
  RefreshCwIcon,
  FileTextIcon,
  InfoIcon,
} from 'lucide-react'
import type { AuditCheck, AuditCategory } from '@/types/blog-audit'

type AuditResultData = {
  pageUrl: string
  targetKeyword: string
  overallScore: number
  grade: string
  categories: AuditCategory[]
  priorityFixes: AuditCheck[]
  recommendations: string
  stats: {
    wordCount: number
    keywordCount: number
    keywordDensity: string
    h1Count: number
    h2Count: number
    h3Count: number
    internalLinks: number
    externalLinks: number
    images: number
    imagesMissingAlt: number
    hasSchema: boolean
    schemaType: string | null
    hasCanonical: boolean
  }
  createdAt: string
}

type BlogAuditResultProps = {
  data: AuditResultData
  onReaudit: () => void
}

function getScoreColor(score: number) {
  if (score >= 85) return 'text-green-600'
  if (score >= 70) return 'text-yellow-600'
  if (score >= 55) return 'text-orange-500'
  return 'text-red-600'
}

function getScoreRingColor(score: number) {
  if (score >= 85) return 'stroke-green-500'
  if (score >= 70) return 'stroke-yellow-500'
  if (score >= 55) return 'stroke-orange-500'
  return 'stroke-red-500'
}

function getGradeBg(grade: string) {
  switch (grade) {
    case 'A': return 'bg-green-100 text-green-700 border-green-200'
    case 'B': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'C': return 'bg-orange-100 text-orange-700 border-orange-200'
    default: return 'bg-red-100 text-red-700 border-red-200'
  }
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-zinc-100"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={getScoreRingColor(score)}
        />
      </svg>
      <span className={`absolute text-2xl font-bold ${getScoreColor(score)}`}>
        {score}
      </span>
    </div>
  )
}

function BlogAuditResult({ data, onReaudit }: BlogAuditResultProps) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())

  function toggleCategory(id: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function copySummary() {
    const lines = [
      `SEO Audit Report — ${data.pageUrl}`,
      `Keyword: ${data.targetKeyword}`,
      `Score: ${data.overallScore}/100 (Grade: ${data.grade})`,
      `Date: ${new Date(data.createdAt).toLocaleString()}`,
      '',
      `Stats:`,
      `- Words: ${data.stats.wordCount}`,
      `- Keyword density: ${data.stats.keywordDensity}`,
      `- Internal links: ${data.stats.internalLinks}`,
      `- Images: ${data.stats.images}`,
      `- Schema: ${data.stats.hasSchema ? data.stats.schemaType : 'None'}`,
      '',
      'Categories:',
      ...data.categories.map((c) => `- ${c.label}: ${c.score}/${c.maxScore}`),
      '',
      'Recommendations:',
      data.recommendations,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    toast.success('Report copied to clipboard')
  }

  const date = new Date(data.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 py-5">
          <ScoreGauge score={data.overallScore} />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`text-sm font-bold ${getGradeBg(data.grade)}`}>
                Grade: {data.grade}
              </Badge>
              <Badge variant="secondary">{data.targetKeyword}</Badge>
            </div>
            <a
              href={data.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              {data.pageUrl}
              <ExternalLinkIcon className="size-3" />
            </a>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Words" value={data.stats.wordCount.toLocaleString()} />
        <StatCard label="Keywords" value={`${data.stats.keywordCount} (${data.stats.keywordDensity})`} />
        <StatCard label="Internal Links" value={String(data.stats.internalLinks)} />
        <StatCard label="External Links" value={String(data.stats.externalLinks)} />
        <StatCard label="Images" value={data.stats.imagesMissingAlt > 0 ? `${data.stats.images} (${data.stats.imagesMissingAlt} no alt)` : String(data.stats.images)} />
        <StatCard label="Schema" value={data.stats.hasSchema ? (data.stats.schemaType ?? 'Yes') : 'None'} />
      </div>

      {/* Priority fixes */}
      {data.priorityFixes.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-orange-700">
              <AlertTriangleIcon className="size-4" />
              {data.priorityFixes.length} issue{data.priorityFixes.length !== 1 ? 's' : ''} need attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.priorityFixes.map((fix, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    fix.severity === 'critical'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {fix.severity === 'critical' ? (
                      <XCircleIcon className="mt-0.5 size-3.5 shrink-0" />
                    ) : (
                      <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{fix.label}</p>
                      <p className="text-xs opacity-80">{fix.detail}</p>
                      {fix.howToFix && (
                        <p className="mt-1 text-xs font-medium">
                          Fix: {fix.howToFix}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category score cards */}
      <div className="space-y-2">
        {data.categories.map((cat) => {
          const expanded = expandedCats.has(cat.id)
          const pct = cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0

          return (
            <Card key={cat.id}>
              <button
                onClick={() => toggleCategory(cat.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{cat.label}</p>
                    <span className={`text-sm font-bold ${getScoreColor(pct)}`}>
                      {cat.score}/{cat.maxScore}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : pct >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <ChevronDownIcon
                  className={`size-4 text-muted-foreground transition-transform ${
                    expanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expanded && (
                <CardContent className="border-t pt-3">
                  <div className="space-y-1.5">
                    {cat.checks.map((check, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        {check.status === 'pass' ? (
                          <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-green-500" />
                        ) : check.status === 'warning' ? (
                          <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-yellow-500" />
                        ) : (
                          <XCircleIcon className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                        )}
                        <div>
                          <span className="font-medium">{check.label}</span>
                          <span className="ml-1.5 text-muted-foreground">{check.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* AI Recommendations */}
      {data.recommendations && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-blue-700">
              <InfoIcon className="size-4" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm text-blue-900">
              {data.recommendations}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onReaudit}>
          <RefreshCwIcon className="size-3.5" />
          Re-Audit
        </Button>
        <Button size="sm" variant="outline" disabled>
          <FileTextIcon className="size-3.5" />
          Export PDF
        </Button>
        <Button size="sm" variant="outline" onClick={copySummary}>
          <ClipboardIcon className="size-3.5" />
          Copy Report
        </Button>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="px-3 py-2.5 text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

export { BlogAuditResult }
export type { AuditResultData }
