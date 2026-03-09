import { NextResponse } from 'next/server'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildPrompt } from '@/lib/content/prompt-builders'
import { getContentTypeConfig } from '@/lib/content/content-types'
import { generateAdImage } from '@/lib/content/ad-creative'
import type { BrandContext } from '@/types/audit'
import type { ContentCategory, ContentType } from '@/types/content'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const generateSchema = z.object({
  clientId: z.string().uuid().optional().nullable(),
  contentType: z.string().min(1),
  category: z.enum(['seo', 'ads', 'email', 'social']),
  inputs: z.record(z.string(), z.string()),
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
    .select('id, agency_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json(
      { success: false, error: 'Profile not found' },
      { status: 401 }
    )
  }

  const body = await request.json()
  const parsed = generateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { clientId, contentType, category, inputs } = parsed.data

  // Validate content type exists
  const typeConfig = getContentTypeConfig(contentType)
  if (!typeConfig) {
    return NextResponse.json(
      { success: false, error: 'Invalid content type' },
      { status: 400 }
    )
  }

  // Validate required inputs
  for (const input of typeConfig.inputs) {
    if (input.required && !inputs[input.id]?.trim()) {
      return NextResponse.json(
        { success: false, error: `${input.label} is required` },
        { status: 400 }
      )
    }
  }

  const admin = createAdminClient()

  let clientName = 'Standalone'
  let brandContext: BrandContext = {
    voice: 'professional and authoritative',
    icp: 'business professionals',
    services: [],
    competitors: [],
    keywords: [],
    goals: 'grow the business',
    additional_context: null,
  }

  if (clientId) {
    const { data: client } = await admin
      .from('clients')
      .select('id, name')
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

  try {
    // Handle ad_creative separately — needs DALL-E + design brief
    if (contentType === 'ad_creative') {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { success: false, error: 'OpenAI API key not configured. Add OPENAI_API_KEY to your environment variables.' },
          { status: 500 }
        )
      }

      const creativeResult = await generateAdImage({
        clientName,
        brandContext,
        adConcept: inputs.ad_concept,
        format: inputs.format,
        style: inputs.style,
        colorOverride: inputs.color_override || undefined,
        agencyId: profile.agency_id,
        clientId: clientId ?? null,
      })

      const { data: row, error: insertError } = await admin
        .from('content_generations')
        .insert({
          agency_id: profile.agency_id,
          client_id: clientId ?? null,
          created_by: profile.id,
          content_category: category,
          content_type: contentType,
          input_params: inputs,
          output: creativeResult.designBrief,
          word_count: creativeResult.designBrief.split(/\s+/).length,
          creative_image_url: creativeResult.imageUrl,
          creative_design_brief: creativeResult.designBrief,
          creative_storage_path: creativeResult.storagePath,
        })
        .select('id')
        .single()

      if (insertError || !row) {
        return NextResponse.json(
          { success: false, error: 'Failed to save content' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          id: row.id,
          output: creativeResult.designBrief,
          wordCount: creativeResult.designBrief.split(/\s+/).length,
          contentType,
          creativeImageUrl: creativeResult.imageUrl,
          creativeDesignBrief: creativeResult.designBrief,
        },
      })
    }

    // All other content types — single Claude call
    const prompt = buildPrompt(
      contentType as ContentType,
      clientName,
      brandContext,
      inputs
    )

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const output = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    const wordCount = output.split(/\s+/).filter(Boolean).length

    const { data: row, error: insertError } = await admin
      .from('content_generations')
      .insert({
        agency_id: profile.agency_id,
        client_id: clientId ?? null,
        created_by: profile.id,
        content_category: category as ContentCategory,
        content_type: contentType,
        input_params: inputs,
        output,
        word_count: wordCount,
      })
      .select('id')
      .single()

    if (insertError || !row) {
      return NextResponse.json(
        { success: false, error: 'Failed to save content' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: row.id,
        output,
        wordCount,
        contentType,
      },
    })
  } catch (err) {
    console.error('Content generation error:', err)
    return NextResponse.json(
      { success: false, error: 'Generation failed. Please try again.' },
      { status: 500 }
    )
  }
}
