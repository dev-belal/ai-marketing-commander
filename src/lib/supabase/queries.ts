import { createClient } from './server'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, agency_id, email, full_name, role')
    .eq('id', user.id)
    .single()

  if (error || !profile) return { data: null, error: 'Profile not found' }

  return { data: profile, error: null }
}

export async function getAgency(agencyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agencies')
    .select('id, name, logo_url, logo_original_url, logo_pending_url, logo_status, plan, account_type, onboarding_completed, website_url, primary_color, created_at')
    .eq('id', agencyId)
    .single()

  return { data, error: error?.message ?? null }
}

export async function getClients(agencyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, website_url, industry, logo_url, is_active, created_at')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  return { data: data ?? [], error: error?.message ?? null }
}

export async function getDashboardStats(agencyId: string) {
  const supabase = await createClient()

  const [clients, audits, content, reports] = await Promise.all([
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId),
    supabase
      .from('audit_runs')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId),
    supabase
      .from('generated_content')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId),
    supabase
      .from('report_exports')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId),
  ])

  return {
    totalClients: clients.count ?? 0,
    auditsRun: audits.count ?? 0,
    contentGenerated: content.count ?? 0,
    reportsExported: reports.count ?? 0,
  }
}

export async function getRecentAuditRuns(agencyId: string, limit = 5) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_runs')
    .select('id, type, status, created_at, clients(name)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data: data ?? [], error: error?.message ?? null }
}

export async function getAuditRuns(agencyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_runs')
    .select('id, type, status, created_at, completed_at, clients(name)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  return { data: data ?? [], error: error?.message ?? null }
}

export async function getAuditRunWithResults(auditRunId: string, agencyId: string) {
  const supabase = await createClient()

  const { data: run, error: runError } = await supabase
    .from('audit_runs')
    .select('id, type, status, created_at, completed_at, client_id, clients(name, website_url)')
    .eq('id', auditRunId)
    .eq('agency_id', agencyId)
    .single()

  if (runError || !run) {
    return { data: null, error: runError?.message ?? 'Audit not found' }
  }

  const { data: results, error: resultsError } = await supabase
    .from('audit_results')
    .select('id, dimension, score, findings, recommendations, tokens_used, created_at')
    .eq('audit_run_id', auditRunId)
    .eq('agency_id', agencyId)
    .order('dimension')

  if (resultsError) {
    return { data: null, error: resultsError.message }
  }

  return {
    data: { ...run, results: results ?? [] },
    error: null,
  }
}

export async function getTeamMembers(agencyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: true })

  return { data: data ?? [], error: error?.message ?? null }
}

export async function getReportExports(agencyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('report_exports')
    .select('id, title, storage_path, created_at, delivered_at, clients(name)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  return { data: data ?? [], error: error?.message ?? null }
}
