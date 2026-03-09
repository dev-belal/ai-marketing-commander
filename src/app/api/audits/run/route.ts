export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { runParallelAudit } from '@/lib/anthropic/run-agent'
import type { AuditDimension, AuditType, BrandContext } from '@/types/audit'

const requestSchema = z.object({
  clientId: z.string().uuid(),
  auditType: z.enum(['full', 'seo', 'content', 'technical']),
})

const AUDIT_TYPE_DIMENSIONS: Record<AuditType, AuditDimension[]> = {
  full: ['seo', 'content', 'technical'],
  seo: ['seo'],
  content: ['content'],
  technical: ['technical'],
}

export async function POST(request: Request) {
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

  const body = await request.json()
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request data.' },
      { status: 400 }
    )
  }

  const { clientId, auditType } = parsed.data
  const agencyId = profile.agency_id

  // Verify client belongs to this agency
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, website_url')
    .eq('id', clientId)
    .eq('agency_id', agencyId)
    .single()

  if (!client) {
    return NextResponse.json(
      { success: false, error: 'Client not found.' },
      { status: 404 }
    )
  }

  // Fetch brand context
  const { data: brandContext } = await supabase
    .from('brand_context')
    .select('voice, icp, services, competitors, keywords, goals, additional_context')
    .eq('client_id', clientId)
    .single()

  const brand: BrandContext = brandContext ?? {
    voice: null,
    icp: null,
    services: [],
    competitors: [],
    keywords: [],
    goals: null,
    additional_context: null,
  }

  // Create audit run
  const { data: auditRun, error: runError } = await supabase
    .from('audit_runs')
    .insert({
      client_id: clientId,
      agency_id: agencyId,
      type: auditType,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (runError || !auditRun) {
    return NextResponse.json(
      { success: false, error: 'Failed to create audit run.' },
      { status: 500 }
    )
  }

  // Run agents in parallel
  const dimensions = AUDIT_TYPE_DIMENSIONS[auditType]

  try {
    const results = await runParallelAudit(
      dimensions,
      brand,
      client.name,
      client.website_url
    )

    // Insert all audit results
    const insertRows = results.map((r) => ({
      audit_run_id: auditRun.id,
      agency_id: agencyId,
      dimension: r.dimension,
      score: r.score,
      findings: r.findings,
      recommendations: r.recommendations,
      raw_output: r.rawOutput,
      tokens_used: r.tokensUsed,
    }))

    const { error: resultsError } = await supabase
      .from('audit_results')
      .insert(insertRows)

    if (resultsError) {
      await supabase
        .from('audit_runs')
        .update({ status: 'failed', error_message: 'Failed to save results.' })
        .eq('id', auditRun.id)

      return NextResponse.json(
        { success: false, error: 'Failed to save audit results.' },
        { status: 500 }
      )
    }

    // Mark audit as completed
    await supabase
      .from('audit_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', auditRun.id)

    return NextResponse.json({
      success: true,
      data: { auditRunId: auditRun.id },
    })
  } catch {
    await supabase
      .from('audit_runs')
      .update({
        status: 'failed',
        error_message: 'AI agent execution failed.',
        completed_at: new Date().toISOString(),
      })
      .eq('id', auditRun.id)

    return NextResponse.json(
      { success: false, error: 'Audit failed. Please try again.' },
      { status: 500 }
    )
  }
}
