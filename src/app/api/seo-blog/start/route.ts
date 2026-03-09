export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runBlogPipeline } from '@/lib/seo-blog/pipeline'
import type { BrandContext } from '@/types/audit'

const startSchema = z.object({
  clientId: z.string().uuid().optional().nullable(),
  websiteUrl: z.string().url(),
  targetKeyword: z.string().min(1).max(200),
})

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

  const { clientId, websiteUrl, targetKeyword } = parsed.data
  const admin = createAdminClient()

  let clientName = 'Standalone'
  let brandContext: BrandContext = {
    voice: null,
    icp: null,
    services: [],
    competitors: [],
    keywords: [],
    goals: null,
    additional_context: null,
  }

  if (clientId) {
    // Verify client belongs to agency
    const { data: client } = await admin
      .from('clients')
      .select('id, name, website_url')
      .eq('id', clientId)
      .eq('agency_id', profile.agency_id)
      .single()

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    clientName = client.name

    // Fetch brand context
    const { data: brandRow } = await admin
      .from('brand_context')
      .select('voice, icp, services, competitors, keywords, goals, additional_context')
      .eq('client_id', clientId)
      .eq('agency_id', profile.agency_id)
      .single()

    if (brandRow) {
      brandContext = brandRow
    }
  }

  // Create run row
  const { data: run, error: insertError } = await admin
    .from('seo_blog_runs')
    .insert({
      agency_id: profile.agency_id,
      client_id: clientId ?? null,
      created_by: profile.id,
      website_url: websiteUrl,
      target_keyword: targetKeyword,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !run) {
    return NextResponse.json(
      { success: false, error: 'Failed to create blog run' },
      { status: 500 }
    )
  }

  // Fire pipeline in background — do NOT await
  runBlogPipeline({
    runId: run.id,
    agencyId: profile.agency_id,
    clientId: clientId ?? null,
    clientName,
    websiteUrl,
    targetKeyword,
    brandContext,
    internalLinksFromScrape: [],
  }).catch((err) => {
    console.error('Blog pipeline error:', err)
  })

  return NextResponse.json({ success: true, data: { runId: run.id } })
}
