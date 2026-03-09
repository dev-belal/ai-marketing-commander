import { createAdminClient } from '@/lib/supabase/admin'

type ReportData = {
  agency: { name: string; logo_url: string | null }
  client: { name: string; website_url: string | null; industry: string | null }
  auditRun: { type: string; created_at: string }
  results: {
    dimension: string
    score: number | null
    findings: string[]
    recommendations: string[]
  }[]
  overallScore: number
}

const DIMENSION_LABELS: Record<string, string> = {
  seo: 'SEO',
  content: 'Content',
  technical: 'Technical',
  competitors: 'Competitors',
  conversion: 'Conversion',
}

function scoreColorHex(score: number): string {
  if (score >= 70) return '#16a34a'
  if (score >= 40) return '#ca8a04'
  return '#dc2626'
}

function scoreBgHex(score: number): string {
  if (score >= 70) return '#f0fdf4'
  if (score >= 40) return '#fefce8'
  return '#fef2f2'
}

export async function generateAuditReport(
  auditRunId: string,
  agencyId: string
): Promise<{ data: { html: string; clientId: string } | null; error: string | null }> {
  const admin = createAdminClient()

  // Fetch all data in parallel
  const [auditRunRes, agencyRes] = await Promise.all([
    admin
      .from('audit_runs')
      .select('id, type, status, created_at, client_id, clients(name, website_url, industry)')
      .eq('id', auditRunId)
      .eq('agency_id', agencyId)
      .single(),
    admin
      .from('agencies')
      .select('name, logo_url')
      .eq('id', agencyId)
      .single(),
  ])

  if (auditRunRes.error || !auditRunRes.data) {
    return { data: null, error: 'Audit run not found.' }
  }

  if (agencyRes.error || !agencyRes.data) {
    return { data: null, error: 'Agency not found.' }
  }

  const auditRun = auditRunRes.data
  const agency = agencyRes.data
  const client = auditRun.clients as unknown as {
    name: string
    website_url: string | null
    industry: string | null
  }

  if (!client) {
    return { data: null, error: 'Client not found.' }
  }

  const { data: resultsData } = await admin
    .from('audit_results')
    .select('dimension, score, findings, recommendations')
    .eq('audit_run_id', auditRunId)
    .eq('agency_id', agencyId)
    .order('dimension')

  const results = (resultsData ?? []).map((r) => ({
    dimension: r.dimension,
    score: r.score,
    findings: Array.isArray(r.findings) ? (r.findings as string[]) : [],
    recommendations: Array.isArray(r.recommendations) ? (r.recommendations as string[]) : [],
  }))

  const overallScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.score ?? 0), 0) / results.length)
      : 0

  const reportData: ReportData = {
    agency,
    client,
    auditRun: { type: auditRun.type, created_at: auditRun.created_at },
    results,
    overallScore,
  }

  const html = buildReportHtml(reportData)

  return { data: { html, clientId: auditRun.client_id }, error: null }
}

function buildReportHtml(data: ReportData): string {
  const { agency, client, auditRun, results, overallScore } = data
  const date = new Date(auditRun.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const auditTypeLabel = auditRun.type.charAt(0).toUpperCase() + auditRun.type.slice(1)

  const logoHtml = agency.logo_url
    ? `<img src="${agency.logo_url}" alt="${agency.name}" style="max-height:48px;max-width:200px;margin-bottom:16px;" />`
    : `<div style="font-size:28px;font-weight:700;color:#0f172a;margin-bottom:16px;">${escapeHtml(agency.name)}</div>`

  const dimensionPages = results
    .map((r) => {
      const label = DIMENSION_LABELS[r.dimension] ?? r.dimension
      const score = r.score ?? 0
      const findingsHtml = r.findings
        .slice(0, 5)
        .map(
          (f, i) => `
        <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;">
          <div style="flex-shrink:0;width:24px;height:24px;border-radius:50%;background:${scoreBgHex(score)};color:${scoreColorHex(score)};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;">${i + 1}</div>
          <div style="font-size:13px;line-height:1.5;color:#334155;">${escapeHtml(f)}</div>
        </div>`
        )
        .join('')

      const recsHtml = r.recommendations
        .slice(0, 5)
        .map(
          (rec) => `
        <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;">
          <div style="flex-shrink:0;width:8px;height:8px;border-radius:50%;background:#3b82f6;margin-top:6px;"></div>
          <div style="font-size:13px;line-height:1.5;color:#334155;">${escapeHtml(rec)}</div>
        </div>`
        )
        .join('')

      return `
      <div class="page">
        <div style="margin-bottom:32px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
            <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin:0;">${label} Analysis</h2>
            <div style="display:flex;align-items:baseline;gap:4px;">
              <span style="font-size:36px;font-weight:800;color:${scoreColorHex(score)};">${score}</span>
              <span style="font-size:14px;color:#94a3b8;">/100</span>
            </div>
          </div>
          <div style="height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;margin-bottom:32px;">
            <div style="height:100%;width:${score}%;background:${scoreColorHex(score)};border-radius:4px;"></div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;">
          <div>
            <h3 style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #fbbf24;">Key Findings</h3>
            ${findingsHtml || '<p style="font-size:13px;color:#94a3b8;">No findings recorded.</p>'}
          </div>
          <div>
            <h3 style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #3b82f6;">Recommendations</h3>
            ${recsHtml || '<p style="font-size:13px;color:#94a3b8;">No recommendations recorded.</p>'}
          </div>
        </div>
      </div>`
    })
    .join('')

  const scoreCardsHtml = results
    .map((r) => {
      const label = DIMENSION_LABELS[r.dimension] ?? r.dimension
      const score = r.score ?? 0
      return `
      <div style="text-align:center;padding:16px 12px;background:${scoreBgHex(score)};border-radius:8px;border:1px solid ${scoreColorHex(score)}20;">
        <div style="font-size:28px;font-weight:800;color:${scoreColorHex(score)};">${score}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">${label}</div>
      </div>`
    })
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #1e293b;
      font-size: 14px;
      line-height: 1.6;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 48px 56px;
      page-break-after: always;
      position: relative;
    }
    .page:last-child { page-break-after: auto; }
    .footer {
      position: absolute;
      bottom: 32px;
      left: 56px;
      right: 56px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="page" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
    ${logoHtml}
    <div style="width:80px;height:3px;background:#3b82f6;margin:24px auto;border-radius:2px;"></div>
    <h1 style="font-size:32px;font-weight:800;color:#0f172a;margin:24px 0 8px;letter-spacing:-0.5px;">Marketing Audit Report</h1>
    <p style="font-size:18px;color:#64748b;margin:0 0 8px;">${auditTypeLabel} Audit</p>
    <p style="font-size:20px;font-weight:600;color:#1e293b;margin:24px 0 4px;">${escapeHtml(client.name)}</p>
    ${client.website_url ? `<p style="font-size:14px;color:#3b82f6;margin:0;">${escapeHtml(client.website_url)}</p>` : ''}
    ${client.industry ? `<p style="font-size:13px;color:#94a3b8;margin:8px 0 0;">${escapeHtml(client.industry)}</p>` : ''}
    <p style="font-size:14px;color:#94a3b8;margin:32px 0 0;">${date}</p>
    <div class="footer">
      <span>${escapeHtml(agency.name)} &mdash; Confidential</span>
      <span>Page 1</span>
    </div>
  </div>

  <!-- EXECUTIVE SUMMARY -->
  <div class="page">
    <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 32px;">Executive Summary</h2>

    <div style="display:flex;align-items:center;gap:40px;margin-bottom:40px;padding:32px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
      <div style="text-align:center;">
        <div style="width:120px;height:120px;border-radius:50%;border:8px solid ${scoreColorHex(overallScore)};display:flex;align-items:center;justify-content:center;background:white;">
          <div>
            <div style="font-size:36px;font-weight:800;color:${scoreColorHex(overallScore)};">${overallScore}</div>
            <div style="font-size:11px;color:#94a3b8;">out of 100</div>
          </div>
        </div>
        <div style="margin-top:12px;font-size:13px;font-weight:600;color:#0f172a;">Overall Score</div>
      </div>
      <div style="flex:1;">
        <p style="font-size:14px;line-height:1.7;color:#334155;margin:0;">
          This ${auditTypeLabel.toLowerCase()} audit evaluated <strong>${escapeHtml(client.name)}</strong> across
          ${results.length} dimension${results.length !== 1 ? 's' : ''}, resulting in an overall score of
          <strong style="color:${scoreColorHex(overallScore)};">${overallScore}/100</strong>.
          ${overallScore >= 70 ? 'The brand shows strong marketing fundamentals with targeted areas for improvement.' : overallScore >= 40 ? 'There are significant opportunities to strengthen the marketing strategy.' : 'Immediate attention is needed across multiple areas to improve marketing effectiveness.'}
        </p>
      </div>
    </div>

    <h3 style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 16px;">Score Breakdown</h3>
    <div style="display:grid;grid-template-columns:repeat(${Math.min(results.length, 3)}, 1fr);gap:16px;margin-bottom:40px;">
      ${scoreCardsHtml}
    </div>

    <h3 style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 16px;">Priority Actions</h3>
    <div style="padding:20px;background:#eff6ff;border-radius:8px;border-left:4px solid #3b82f6;">
      ${results
        .flatMap((r) => r.recommendations.slice(0, 2))
        .slice(0, 5)
        .map(
          (rec) => `
        <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;">
          <div style="flex-shrink:0;color:#3b82f6;font-weight:700;font-size:14px;">&#10003;</div>
          <div style="font-size:13px;color:#1e40af;">${escapeHtml(rec)}</div>
        </div>`
        )
        .join('')}
    </div>

    <div class="footer">
      <span>${escapeHtml(agency.name)} &mdash; Confidential</span>
      <span>Page 2</span>
    </div>
  </div>

  <!-- DIMENSION PAGES -->
  ${dimensionPages}

</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
