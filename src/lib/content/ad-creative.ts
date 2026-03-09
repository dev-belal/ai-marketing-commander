import { openai } from '@/lib/openai/client'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import type { BrandContext } from '@/types/audit'
import type { AdCreativeResult } from '@/types/content'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

type AdCreativeParams = {
  clientName: string
  brandContext: BrandContext
  adConcept: string
  format: string
  style: string
  colorOverride?: string
  agencyId: string
  clientId: string | null
}

const FORMAT_TO_SIZE: Record<string, '1024x1024' | '1024x1792' | '1792x1024'> = {
  square_1080x1080: '1024x1024',
  story_1080x1920: '1024x1792',
  banner_1200x628: '1792x1024',
  reel_cover_1080x1080: '1024x1024',
}

export async function generateAdImage(params: AdCreativeParams): Promise<AdCreativeResult> {
  const {
    clientName,
    brandContext,
    adConcept,
    format,
    style,
    colorOverride,
    agencyId,
    clientId,
  } = params

  const primaryColor = colorOverride
    ?? (Array.isArray(brandContext.keywords) && brandContext.keywords.length > 0
      ? '#2563EB'
      : '#2563EB')

  const dallePrompt = `Professional marketing advertisement for ${clientName}.
${adConcept}.
Style: ${style}, clean composition, high contrast.
Color palette: ${primaryColor} accents.
Format optimized for ${format}.
No text overlays. No logos.
Professional commercial photography / illustration style.
Ultra high quality, production ready.`

  const size = FORMAT_TO_SIZE[format] ?? '1024x1024'

  const imageResponse = await openai.images.generate({
    model: 'dall-e-3',
    prompt: dallePrompt,
    size,
    quality: 'hd',
    style: 'vivid',
    n: 1,
  })

  const openaiImageUrl = imageResponse.data?.[0]?.url
  if (!openaiImageUrl) {
    throw new Error('DALL-E did not return an image URL')
  }

  // Download the image from OpenAI (expires in ~1 hour)
  const imgRes = await fetch(openaiImageUrl)
  if (!imgRes.ok) {
    throw new Error('Failed to download generated image')
  }
  const imageBuffer = Buffer.from(await imgRes.arrayBuffer())

  // Upload to Supabase Storage
  const timestamp = Date.now()
  const clientFolder = clientId ?? 'standalone'
  const storagePath = `${agencyId}/${clientFolder}/${timestamp}.png`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from('creatives')
    .upload(storagePath, imageBuffer, {
      contentType: 'image/png',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`)
  }

  const { data: publicUrl } = admin.storage
    .from('creatives')
    .getPublicUrl(storagePath)

  // Generate design brief in parallel (already called separately)
  const designBrief = await generateDesignBrief(params)

  return {
    imageUrl: publicUrl.publicUrl,
    designBrief,
    storagePath,
  }
}

export async function generateDesignBrief(params: AdCreativeParams): Promise<string> {
  const { clientName, adConcept, format, style, colorOverride } = params
  const primaryColor = colorOverride ?? '#2563EB'

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate a Canva-compatible design brief for an ad creative.
Client: ${clientName}
Ad concept: ${adConcept}
Format: ${format}
Style: ${style}
Primary brand color: ${primaryColor}

Return this exact structure:

DESIGN BRIEF: ${adConcept}
FORMAT: ${format}
STYLE DIRECTION: ${style}

VISUAL CONCEPT:
[2-3 sentences describing the visual]

COLOR PALETTE:
Primary: ${primaryColor}
Secondary: [complementary color]
Background: [recommendation]

TYPOGRAPHY:
Headline: [suggested font style] — [headline text]
Subtext: [body copy text]
CTA Button: [CTA text]

COMPOSITION:
[describe layout, focal points, hierarchy]

CANVA TEMPLATE SEARCH:
[2-3 Canva template keywords to find a matching template]

COPY OVERLAY:
Headline: [headline]
Subheadline: [subheadline]
CTA: [call to action text]

Return only the brief. No preamble.`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}
