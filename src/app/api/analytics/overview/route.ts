import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { data: profile } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json(
      { success: false, error: 'User profile not found.' },
      { status: 403 }
    )
  }

  const agencyId = profile.agency_id

  // ── Fetch all data in parallel ──────────────────────────────

  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)
  const twelveWeeksAgoISO = twelveWeeksAgo.toISOString()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    auditsCount,
    blogsCount,
    blogAuditsCount,
    contentCount,
    clientsCount,
    recentAudits,
    recentBlogs,
    recentBlogAudits,
    recentContent,
    weeklyAudits,
    weeklyBlogs,
    weeklyBlogAudits,
    weeklyContent,
    contentTypes,
    clientActivity,
    auditScores,
    blogQAScores,
    blogAuditScores,
  ] = await Promise.all([
    // ── Counts ──
    supabase
      .from('audit_runs')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('status', 'completed'),
    supabase
      .from('seo_blog_runs')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('status', 'complete'),
    supabase
      .from('blog_audit_runs')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId),
    supabase
      .from('content_generations')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('status', 'completed'),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId),

    // ── Recent activity (last 30 items from each table) ──
    supabase
      .from('audit_runs')
      .select('id, created_at, type, clients(name, website_url)')
      .eq('agency_id', agencyId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('seo_blog_runs')
      .select('id, created_at, target_keyword, blog_title, qa_score, clients(name)')
      .eq('agency_id', agencyId)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('blog_audit_runs')
      .select('id, created_at, page_url, overall_score, clients(name)')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('content_generations')
      .select('id, created_at, content_type, clients(name)')
      .eq('agency_id', agencyId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(30),

    // ── Weekly activity (last 12 weeks) ──
    supabase
      .from('audit_runs')
      .select('created_at')
      .eq('agency_id', agencyId)
      .eq('status', 'completed')
      .gte('created_at', twelveWeeksAgoISO),
    supabase
      .from('seo_blog_runs')
      .select('created_at')
      .eq('agency_id', agencyId)
      .eq('status', 'complete')
      .gte('created_at', twelveWeeksAgoISO),
    supabase
      .from('blog_audit_runs')
      .select('created_at')
      .eq('agency_id', agencyId)
      .gte('created_at', twelveWeeksAgoISO),
    supabase
      .from('content_generations')
      .select('created_at')
      .eq('agency_id', agencyId)
      .eq('status', 'completed')
      .gte('created_at', twelveWeeksAgoISO),

    // ── Content type breakdown ──
    supabase
      .from('content_generations')
      .select('content_type')
      .eq('agency_id', agencyId)
      .eq('status', 'completed'),

    // ── Top clients by activity ──
    supabase
      .from('clients')
      .select('id, name, website_url')
      .eq('agency_id', agencyId),

    // ── Quality scores ──
    supabase
      .from('audit_results')
      .select('score')
      .eq('agency_id', agencyId)
      .not('score', 'is', null),
    supabase
      .from('seo_blog_runs')
      .select('qa_score')
      .eq('agency_id', agencyId)
      .eq('status', 'complete')
      .not('qa_score', 'is', null),
    supabase
      .from('blog_audit_runs')
      .select('overall_score')
      .eq('agency_id', agencyId)
      .not('overall_score', 'is', null),
  ])

  // ── Build stats ──

  const totalAudits = auditsCount.count ?? 0
  const totalBlogs = blogsCount.count ?? 0
  const totalBlogAudits = blogAuditsCount.count ?? 0
  const totalContent = contentCount.count ?? 0
  const totalClients = clientsCount.count ?? 0

  const hoursSaved =
    totalAudits * 3 +
    totalBlogs * 2 +
    totalBlogAudits * 1 +
    totalContent * 0.5

  // ── Weekly activity grouping ──

  function getWeekStart(dateStr: string): string {
    const d = new Date(dateStr)
    const day = d.getUTCDay()
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff))
    return monday.toISOString().split('T')[0]
  }

  function buildWeekMap(items: { created_at: string }[] | null): Record<string, number> {
    const map: Record<string, number> = {}
    for (const item of items ?? []) {
      const week = getWeekStart(item.created_at)
      map[week] = (map[week] ?? 0) + 1
    }
    return map
  }

  const auditsByWeek = buildWeekMap(weeklyAudits.data)
  const blogsByWeek = buildWeekMap(weeklyBlogs.data)
  const blogAuditsByWeek = buildWeekMap(weeklyBlogAudits.data)
  const contentByWeek = buildWeekMap(weeklyContent.data)

  // Generate last 12 week keys
  const weeklyActivity: {
    week: string
    audits: number
    blogs: number
    blogAudits: number
    content: number
  }[] = []

  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i * 7)
    const week = getWeekStart(d.toISOString())
    if (!weeklyActivity.find((w) => w.week === week)) {
      weeklyActivity.push({
        week,
        audits: auditsByWeek[week] ?? 0,
        blogs: blogsByWeek[week] ?? 0,
        blogAudits: blogAuditsByWeek[week] ?? 0,
        content: contentByWeek[week] ?? 0,
      })
    }
  }

  // ── Content type breakdown ──

  const contentBreakdownMap: Record<string, number> = {}
  for (const item of contentTypes.data ?? []) {
    const t = item.content_type ?? 'other'
    contentBreakdownMap[t] = (contentBreakdownMap[t] ?? 0) + 1
  }
  const contentBreakdown = Object.entries(contentBreakdownMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  // ── Top clients ──

  const clients = clientActivity.data ?? []

  // Count activity per client
  const clientAuditCounts: Record<string, number> = {}
  const clientBlogCounts: Record<string, number> = {}
  const clientContentCounts: Record<string, number> = {}
  const clientLastActive: Record<string, string> = {}

  function trackClientActivity(
    items: { created_at: string; clients: { name: string } | null }[] | null,
    countMap: Record<string, number>,
    clientIdField: string
  ) {
    // This won't work with Supabase join structure — we need client_id
    void items
    void countMap
    void clientIdField
  }
  void trackClientActivity

  // Fetch activity counts per client using separate queries
  const [clientAudits, clientBlogs, clientContents] = await Promise.all([
    supabase
      .from('audit_runs')
      .select('client_id, created_at')
      .eq('agency_id', agencyId)
      .eq('status', 'completed'),
    supabase
      .from('seo_blog_runs')
      .select('client_id, created_at')
      .eq('agency_id', agencyId)
      .eq('status', 'complete'),
    supabase
      .from('content_generations')
      .select('client_id, created_at')
      .eq('agency_id', agencyId)
      .eq('status', 'completed'),
  ])

  for (const a of clientAudits.data ?? []) {
    clientAuditCounts[a.client_id] = (clientAuditCounts[a.client_id] ?? 0) + 1
    if (!clientLastActive[a.client_id] || a.created_at > clientLastActive[a.client_id]) {
      clientLastActive[a.client_id] = a.created_at
    }
  }
  for (const b of clientBlogs.data ?? []) {
    clientBlogCounts[b.client_id] = (clientBlogCounts[b.client_id] ?? 0) + 1
    if (!clientLastActive[b.client_id] || b.created_at > clientLastActive[b.client_id]) {
      clientLastActive[b.client_id] = b.created_at
    }
  }
  for (const c of clientContents.data ?? []) {
    clientContentCounts[c.client_id] = (clientContentCounts[c.client_id] ?? 0) + 1
    if (!clientLastActive[c.client_id] || c.created_at > clientLastActive[c.client_id]) {
      clientLastActive[c.client_id] = c.created_at
    }
  }

  const topClients = clients
    .map((client) => ({
      id: client.id,
      name: client.name,
      websiteUrl: client.website_url,
      auditCount: clientAuditCounts[client.id] ?? 0,
      blogCount: clientBlogCounts[client.id] ?? 0,
      contentCount: clientContentCounts[client.id] ?? 0,
      total:
        (clientAuditCounts[client.id] ?? 0) +
        (clientBlogCounts[client.id] ?? 0) +
        (clientContentCounts[client.id] ?? 0),
      lastActive: clientLastActive[client.id] ?? null,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // ── Recent activity feed ──

  type ActivityItem = {
    type: 'audit' | 'blog' | 'blog_audit' | 'content'
    id: string
    createdAt: string
    subject: string
    clientName: string
    score: number | null
    title: string | null
  }

  const feed: ActivityItem[] = []

  for (const a of recentAudits.data ?? []) {
    const client = a.clients as unknown as { name: string; website_url: string } | null
    feed.push({
      type: 'audit',
      id: a.id,
      createdAt: a.created_at,
      subject: client?.website_url ?? a.type,
      clientName: client?.name ?? 'Unknown',
      score: null,
      title: null,
    })
  }

  for (const b of recentBlogs.data ?? []) {
    const client = b.clients as unknown as { name: string } | null
    feed.push({
      type: 'blog',
      id: b.id,
      createdAt: b.created_at,
      subject: b.target_keyword,
      clientName: client?.name ?? 'Unknown',
      score: b.qa_score ?? null,
      title: b.blog_title ?? null,
    })
  }

  for (const ba of recentBlogAudits.data ?? []) {
    const client = ba.clients as unknown as { name: string } | null
    feed.push({
      type: 'blog_audit',
      id: ba.id,
      createdAt: ba.created_at,
      subject: ba.page_url,
      clientName: client?.name ?? 'Unknown',
      score: ba.overall_score ?? null,
      title: null,
    })
  }

  for (const c of recentContent.data ?? []) {
    const client = c.clients as unknown as { name: string } | null
    feed.push({
      type: 'content',
      id: c.id,
      createdAt: c.created_at,
      subject: c.content_type,
      clientName: client?.name ?? 'Unknown',
      score: null,
      title: null,
    })
  }

  feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const recentActivity = feed.slice(0, 30)

  // ── Quality scores ──

  function avg(items: { [k: string]: number | null }[] | null, key: string): number | null {
    const vals = (items ?? [])
      .map((i) => i[key] as number | null)
      .filter((v): v is number => v !== null && v !== undefined)
    if (vals.length === 0) return null
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
  }

  const qualityScores = {
    avgBlogQA: avg(blogQAScores.data, 'qa_score'),
    avgAuditScore: avg(auditScores.data, 'score'),
    avgBlogAuditScore: avg(blogAuditScores.data, 'overall_score'),
  }

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        totalAudits,
        totalBlogs,
        totalBlogAudits,
        totalContent,
        totalClients,
        hoursSaved,
      },
      weeklyActivity,
      contentBreakdown,
      topClients,
      recentActivity,
      qualityScores,
    },
  })
}