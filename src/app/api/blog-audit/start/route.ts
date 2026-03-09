export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scrapeBlogPage } from '@/lib/blog-audit/scrape-page'
import { runBlogAudit } from '@/lib/blog-audit/audit-engine'
import Anthropic from '@anthropic-ai/sdk'

const startSchema = z.object({
  pageUrl: z.string().url(),
  targetKeyword: z.string().min(1).max(200),
  clientId: z.string().uuid().optional().nullable(),
})

async function runAuditPipeline(
  runId: string,
  agencyId: string,
  pageUrl: string,
  targetKeyword: string
) {
  const admin = createAdminClient()

  try {
    // Step 1: Scrape
    await admin.from('blog_audit_runs').update({ status: 'scraping' }).eq('id', runId)

    const pageData = await scrapeBlogPage(pageUrl)

    if (pageData.error) {
      await admin.from('blog_audit_runs').update({
        status: 'failed',
        error_message: `Scrape failed: ${pageData.error}`,
      }).eq('id', runId)
      return
    }

    // Step 2: Analyze
    await admin.from('blog_audit_runs').update({
      status: 'analyzing',
      page_title: pageData.title,
      meta_description: pageData.metaDescription,
      h1: pageData.h1s[0] ?? null,
      word_count: pageData.wordCount,
    }).eq('id', runId)

    const result = runBlogAudit(pageData, targetKeyword, runId)

    // Step 3: AI recommendations
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    const failedChecks = result.priorityFixes
      .map((f) => `- [${f.severity.toUpperCase()}] ${f.label}: ${f.detail}`)
      .join('\n')

    let recommendations = ''
    if (failedChecks) {
      const aiRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20250929',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: `A blog page at ${pageUrl} targeting the keyword "${targetKeyword}" scored ${result.overallScore}/100 in an SEO audit.

Failed checks:
${failedChecks}

Write 3-5 specific, actionable recommendations to improve this page's SEO score. Be direct and specific. No preamble. Format as a numbered list.`,
          },
        ],
      })

      const content = aiRes.content[0]
      if (content.type === 'text') {
        recommendations = content.text.trim()
      }
    } else {
      recommendations = 'This page scores well across all major SEO checks. Keep up the great work!'
    }

    // Save all results
    const allIssues = result.categories.flatMap((c) => c.checks.filter((ch) => ch.status !== 'pass'))

    await admin.from('blog_audit_runs').update({
      overall_score: result.overallScore,
      qa_issues: allIssues,
      has_schema: result.stats.hasSchema,
      schema_type: result.stats.schemaType,
      canonical_url: pageData.canonicalUrl,
      has_canonical: result.stats.hasCanonical,
      internal_link_count: result.stats.internalLinks,
      external_link_count: result.stats.externalLinks,
      image_count: result.stats.images,
      images_missing_alt: result.stats.imagesMissingAlt,
      keyword_count: result.stats.keywordCount,
      h2_count: result.stats.h2Count,
      h3_count: result.stats.h3Count,
      recommendations,
      priority_fixes: result.priorityFixes,
      status: 'complete',
      completed_at: new Date().toISOString(),
    }).eq('id', runId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audit pipeline failed'
    await admin.from('blog_audit_runs').update({
      status: 'failed',
      error_message: message,
    }).eq('id', runId)
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    )
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, agency_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json(
      { success: false, error: 'Profile not found' },
      { status: 401 }
    )
  }

  const body = await request.json()
  const parsed = startSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { pageUrl, targetKeyword, clientId } = parsed.data

  // Verify client if provided
  if (clientId) {
    const admin = createAdminClient()
    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('agency_id', profile.agency_id)
      .single()

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }
  }

  // Create run row
  const admin = createAdminClient()
  const { data: run, error: insertError } = await admin
    .from('blog_audit_runs')
    .insert({
      agency_id: profile.agency_id,
      client_id: clientId ?? null,
      created_by: profile.id,
      page_url: pageUrl,
      target_keyword: targetKeyword,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !run) {
    return NextResponse.json(
      { success: false, error: 'Failed to create audit run' },
      { status: 500 }
    )
  }

  // Fire pipeline in background
  runAuditPipeline(run.id, profile.agency_id, pageUrl, targetKeyword).catch((err) => {
    console.error('Blog audit pipeline error:', err)
  })

  return NextResponse.json({ success: true, data: { runId: run.id } })
}
