'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ClockIcon,
  ZapIcon,
  FileTextIcon,
  PenToolIcon,
  SearchIcon,
  UsersIcon,
  SparklesIcon,
  LockIcon,
  CheckCircleIcon,
  BarChart2Icon,
  ArrowUpRightIcon,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────

interface AnalyticsData {
  stats: {
    totalAudits: number
    totalBlogs: number
    totalBlogAudits: number
    totalContent: number
    totalClients: number
    hoursSaved: number
  }
  weeklyActivity: {
    week: string
    audits: number
    blogs: number
    blogAudits: number
    content: number
  }[]
  contentBreakdown: { type: string; count: number }[]
  topClients: {
    id: string
    name: string
    websiteUrl: string | null
    auditCount: number
    blogCount: number
    contentCount: number
    total: number
    lastActive: string | null
  }[]
  recentActivity: {
    type: 'audit' | 'blog' | 'blog_audit' | 'content'
    id: string
    createdAt: string
    subject: string
    clientName: string
    score: number | null
    title: string | null
  }[]
  qualityScores: {
    avgBlogQA: number | null
    avgAuditScore: number | null
    avgBlogAuditScore: number | null
  }
}

// ── Helpers ────────────────────────────────────────────────

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function formatWeekLabel(week: string) {
  const d = new Date(week + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function scoreColor(score: number | null) {
  if (score === null) return 'text-muted-foreground'
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

function scoreBgColor(score: number | null) {
  if (score === null) return 'bg-muted'
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

const CONTENT_TYPE_COLORS: Record<string, string> = {
  service_page: '#2563EB',
  blog: '#7C3AED',
  google_search_ads: '#D97706',
  meta_ad_copy: '#DC2626',
  linkedin_post: '#0891B2',
  instagram_caption: '#DB2777',
  email: '#059669',
  landing_page: '#8B5CF6',
  twitter_post: '#1D9BF0',
  facebook_ad: '#E11D48',
}

function getContentColor(type: string) {
  return CONTENT_TYPE_COLORS[type] ?? '#6B7280'
}

function formatContentType(type: string) {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const ACTIVITY_ICON: Record<string, { icon: typeof ZapIcon; bg: string; color: string }> = {
  audit: { icon: ZapIcon, bg: 'bg-blue-500/10', color: 'text-blue-500' },
  blog: { icon: FileTextIcon, bg: 'bg-purple-500/10', color: 'text-purple-500' },
  blog_audit: { icon: SearchIcon, bg: 'bg-cyan-500/10', color: 'text-cyan-500' },
  content: { icon: PenToolIcon, bg: 'bg-amber-500/10', color: 'text-amber-500' },
}

const DATE_RANGES = ['7 days', '30 days', '90 days', 'All time'] as const
type DateRange = (typeof DATE_RANGES)[number]

// ── Count-up hook ──────────────────────────────────────────

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target === 0) {
      setValue(0)
      return
    }
    const start = performance.now()
    let raf: number

    function update(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) {
        raf = requestAnimationFrame(update)
      }
    }

    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

// ── Skeleton components ────────────────────────────────────

function SkeletonStatCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="skeleton h-10 w-10 rounded-lg" />
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
            <div className="skeleton h-8 w-20 mb-2" />
            <div className="skeleton h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SkeletonChart() {
  return (
    <Card>
      <CardHeader>
        <div className="skeleton h-6 w-40 mb-2" />
        <div className="skeleton h-4 w-56" />
      </CardHeader>
      <CardContent>
        <div className="skeleton h-[300px] w-full" />
      </CardContent>
    </Card>
  )
}

function SkeletonTable() {
  return (
    <Card>
      <CardHeader>
        <div className="skeleton h-6 w-48 mb-2" />
        <div className="skeleton h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonFeed() {
  return (
    <Card>
      <CardHeader>
        <div className="skeleton h-6 w-36 mb-2" />
        <div className="skeleton h-4 w-56" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Stat Card ──────────────────────────────────────────────

function StatCard({
  icon: Icon,
  iconColor,
  value,
  suffix,
  label,
  sub,
  showTrend,
}: {
  icon: typeof ClockIcon
  iconColor: string
  value: number
  suffix?: string
  label: string
  sub: string
  showTrend?: boolean
}) {
  const displayValue = useCountUp(value)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
            <Icon className="size-5" />
          </div>
          {showTrend && value > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
              <ArrowUpRightIcon className="size-3" />
            </span>
          )}
        </div>
        <div className="text-2xl font-bold">
          {displayValue}{suffix}
        </div>
        <p className="text-sm font-medium text-foreground mt-1">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  )
}

// ── Custom Chart Tooltip ───────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card p-3 shadow-md">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Quality Score Row ──────────────────────────────────────

function QualityScoreRow({
  icon: Icon,
  label,
  score,
}: {
  icon: typeof CheckCircleIcon
  label: string
  score: number | null
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 w-[140px] shrink-0">
        <Icon className={`size-4 ${scoreColor(score)}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex-1">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreBgColor(score)}`}
            style={{ width: mounted && score !== null ? `${score}%` : '0%' }}
          />
        </div>
      </div>
      <span className="text-sm font-bold w-[56px] text-right">
        {score !== null ? `${score}/100` : '—'}
      </span>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────

function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('All time')
  const [chartFilter, setChartFilter] = useState<'all' | 'audits' | 'blogs' | 'content'>('all')
  const [activityLimit, setActivityLimit] = useState(10)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics/overview')
        const json = await res.json()
        if (!json.success) {
          setError(json.error ?? 'Failed to load analytics')
          return
        }
        setData(json.data)
      } catch {
        setError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filterByDateRange = useCallback(
    <T extends { week?: string; createdAt?: string }>(items: T[], dateField: 'week' | 'createdAt'): T[] => {
      if (dateRange === 'All time') return items
      const days = dateRange === '7 days' ? 7 : dateRange === '30 days' ? 30 : 90
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      return items.filter((item) => {
        const val = item[dateField]
        if (!val) return false
        return new Date(val) >= cutoff
      })
    },
    [dateRange]
  )

  // ── Loading ──

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Your agency&apos;s performance at a glance</p>
        </div>
        <SkeletonStatCards />
        <SkeletonChart />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2"><SkeletonChart /></div>
          <div className="lg:col-span-3"><SkeletonChart /></div>
        </div>
        <SkeletonTable />
        <SkeletonFeed />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  const { stats, qualityScores } = data
  const hasAnyData =
    stats.totalAudits + stats.totalBlogs + stats.totalBlogAudits + stats.totalContent > 0

  // ── Zero data empty state ──

  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Your agency&apos;s performance at a glance</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="flex size-16 items-center justify-center rounded-full bg-blue-500/10">
              <SparklesIcon className="size-8 text-blue-500" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">Your analytics will appear here</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                Start by running your first audit or generating content for a client.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Link href="/audits">
                <Button>Run an Audit</Button>
              </Link>
              <Link href="/content">
                <Button variant="outline">Generate Content</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Filtered data ──

  const filteredWeekly = filterByDateRange(data.weeklyActivity, 'week')
  const filteredActivity = filterByDateRange(data.recentActivity, 'createdAt')

  // ── Content breakdown for pie chart ──

  const breakdown = data.contentBreakdown.slice(0, 6)
  const otherCount = data.contentBreakdown
    .slice(6)
    .reduce((sum, item) => sum + item.count, 0)
  const pieData = otherCount > 0
    ? [...breakdown, { type: 'other', count: otherCount }]
    : breakdown
  const pieTotal = pieData.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Your agency&apos;s performance at a glance</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {DATE_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                dateRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={ClockIcon}
          iconColor="bg-green-500/10 text-green-500"
          value={stats.hoursSaved}
          suffix="h"
          label="Hours Saved"
          sub="Estimated time saved vs manual work"
          showTrend
        />
        <StatCard
          icon={ZapIcon}
          iconColor="bg-blue-500/10 text-blue-500"
          value={stats.totalAudits}
          label="Marketing Audits"
          sub="Completed client audits"
        />
        <StatCard
          icon={FileTextIcon}
          iconColor="bg-purple-500/10 text-purple-500"
          value={stats.totalBlogs}
          label="SEO Blog Posts"
          sub="AI-generated & QA-checked"
        />
        <StatCard
          icon={PenToolIcon}
          iconColor="bg-amber-500/10 text-amber-500"
          value={stats.totalContent}
          label="Content Generated"
          sub="Across 18 content types"
        />
        <StatCard
          icon={SearchIcon}
          iconColor="bg-cyan-500/10 text-cyan-500"
          value={stats.totalBlogAudits}
          label="Blog Audits"
          sub="Existing content analyzed"
        />
        <StatCard
          icon={UsersIcon}
          iconColor="bg-indigo-500/10 text-indigo-500"
          value={stats.totalClients}
          label="Active Clients"
          sub="Clients with generated content"
        />
      </div>

      {/* ── Activity Chart ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Activity Over Time</CardTitle>
              <CardDescription>Content generated per week</CardDescription>
            </div>
            <div className="flex gap-1 rounded-lg border p-1">
              {(['all', 'audits', 'blogs', 'content'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setChartFilter(f)}
                  className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    chartFilter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredWeekly.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <SparklesIcon className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No activity yet — start by running an audit</p>
              <Link href="/audits">
                <Button variant="outline" size="sm" className="mt-2">Run Your First Audit</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <div className="min-w-[500px]">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={filteredWeekly}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="week"
                      tickFormatter={formatWeekLabel}
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      strokeOpacity={0.2}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      strokeOpacity={0.2}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    {(chartFilter === 'all' || chartFilter === 'audits') && (
                      <Line
                        type="monotone"
                        dataKey="audits"
                        name="Audits"
                        stroke="#2563EB"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    )}
                    {(chartFilter === 'all' || chartFilter === 'blogs') && (
                      <Line
                        type="monotone"
                        dataKey="blogs"
                        name="Blogs"
                        stroke="#7C3AED"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    )}
                    {(chartFilter === 'all' || chartFilter === 'audits') && (
                      <Line
                        type="monotone"
                        dataKey="blogAudits"
                        name="Blog Audits"
                        stroke="#0891B2"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    )}
                    {(chartFilter === 'all' || chartFilter === 'content') && (
                      <Line
                        type="monotone"
                        dataKey="content"
                        name="Content"
                        stroke="#D97706"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Two Column: Content Breakdown + Quality Scores ── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Content Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Content Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                <PenToolIcon className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No content generated yet</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="relative">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="count"
                          nameKey="type"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.type} fill={getContentColor(entry.type)} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [String(value), formatContentType(String(name))]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{pieTotal}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {pieData.map((item) => (
                    <div key={item.type} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: getContentColor(item.type) }}
                        />
                        <span className="text-muted-foreground">{formatContentType(item.type)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.count}</span>
                        <span className="text-muted-foreground w-8 text-right">
                          {pieTotal > 0 ? Math.round((item.count / pieTotal) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quality Scores */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quality Scores</CardTitle>
            <CardDescription>Average scores across all generated content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <QualityScoreRow
                icon={CheckCircleIcon}
                label="Blog QA Score"
                score={qualityScores.avgBlogQA}
              />
              <QualityScoreRow
                icon={BarChart2Icon}
                label="Audit Score"
                score={qualityScores.avgAuditScore}
              />
              <QualityScoreRow
                icon={SearchIcon}
                label="Blog Audit Score"
                score={qualityScores.avgBlogAuditScore}
              />
            </div>
            <div className="mt-6 rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                {qualityScores.avgBlogQA !== null && qualityScores.avgBlogQA >= 80
                  ? '✓ Excellent blog quality maintained'
                  : qualityScores.avgBlogQA !== null && qualityScores.avgBlogQA >= 60
                    ? '↑ Blog quality could be improved — consider revision passes'
                    : 'No blog data yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Top Clients Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Top Clients by Activity</CardTitle>
          <CardDescription>Clients ranked by total content generated</CardDescription>
        </CardHeader>
        <CardContent>
          {data.topClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <UsersIcon className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Add your first client to start tracking</p>
              <Link href="/clients">
                <Button variant="outline" size="sm" className="mt-2">Add Client</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="pb-3 text-left font-medium">Client</th>
                      <th className="pb-3 text-center font-medium">Audits</th>
                      <th className="pb-3 text-center font-medium">Blog Posts</th>
                      <th className="pb-3 text-center font-medium">Content</th>
                      <th className="pb-3 text-center font-medium">Total</th>
                      <th className="pb-3 text-right font-medium">Last Active</th>
                      <th className="pb-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topClients.map((client) => (
                      <tr
                        key={client.id}
                        className="border-b last:border-0 transition-colors hover:bg-muted/50"
                      >
                        <td className="py-3 text-sm font-medium">{client.name}</td>
                        <td className="py-3 text-center text-sm">{client.auditCount}</td>
                        <td className="py-3 text-center text-sm">{client.blogCount}</td>
                        <td className="py-3 text-center text-sm">{client.contentCount}</td>
                        <td className="py-3 text-center text-sm font-bold">{client.total}</td>
                        <td className="py-3 text-right text-xs text-muted-foreground">
                          {client.lastActive ? timeAgo(client.lastActive) : '—'}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/clients/${client.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <Link href="/clients" className="text-xs font-medium text-primary hover:underline">
                  View all clients →
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Recent Activity Feed ── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your last 30 actions across all clients</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <SparklesIcon className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No activity in this time range</p>
            </div>
          ) : (
            <>
              <div className="space-y-0">
                {filteredActivity.slice(0, activityLimit).map((item, idx) => {
                  const iconInfo = ACTIVITY_ICON[item.type]
                  const Icon = iconInfo.icon

                  let description = ''
                  if (item.type === 'audit') {
                    description = `Ran marketing audit for ${item.clientName}`
                  } else if (item.type === 'blog') {
                    description = `Generated blog post — ${item.title ?? item.subject}`
                  } else if (item.type === 'blog_audit') {
                    description = `Audited blog post at ${item.subject}`
                  } else {
                    description = `Generated ${formatContentType(item.subject)} for ${item.clientName}`
                  }

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={`flex gap-4 py-3.5 ${
                        idx < Math.min(activityLimit, filteredActivity.length) - 1
                          ? 'border-b'
                          : ''
                      }`}
                    >
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${iconInfo.bg}`}
                      >
                        <Icon className={`size-4 ${iconInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.score !== null && (
                            <span
                              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                item.score >= 80
                                  ? 'bg-green-500/10 text-green-600'
                                  : item.score >= 60
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-red-500/10 text-red-600'
                              }`}
                            >
                              {item.score}/100
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {filteredActivity.length > activityLimit && (
                <div className="mt-4 text-center">
                  <Button variant="ghost" size="sm" onClick={() => setActivityLimit(30)}>
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Team Analytics (Upgrade Prompt) ── */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <LockIcon className="size-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Team Analytics</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              See individual team member performance, activity breakdowns, and collaboration metrics.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            Coming Soon for Solo Plan
          </span>
          <div className="mt-2 max-w-sm w-full space-y-2 opacity-40 pointer-events-none select-none">
            {[
              'Team member activity breakdown',
              'Per-member content generated',
              'Collaboration metrics',
              'Role-based performance tracking',
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 rounded-lg border p-2.5 text-xs text-muted-foreground"
              >
                <CheckCircleIcon className="size-3.5 shrink-0" />
                {feature}
              </div>
            ))}
          </div>
          <Button disabled className="mt-2" title="Coming Soon">
            Upgrade to Team Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export { AnalyticsDashboard }