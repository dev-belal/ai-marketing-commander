import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { scrapeWebsite } from './scrape-website'
import { runQAChecks } from './qa-engine'
import { humanizeBlog } from './humanize-blog'
import type { BrandContext } from '@/types/audit'
import type { QAResult } from '@/types/seo-blog'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface PipelineInput {
  runId: string
  agencyId: string
  clientId: string | null
  clientName: string
  websiteUrl: string
  targetKeyword: string
  brandContext: BrandContext
  internalLinksFromScrape: string[]
}

async function updateRunStatus(
  runId: string,
  data: Record<string, unknown>
) {
  const admin = createAdminClient()
  await admin.from('seo_blog_runs').update(data).eq('id', runId)
}

async function failRun(runId: string, message: string) {
  await updateRunStatus(runId, {
    status: 'failed',
    error_message: message,
  })
}

function buildBrandContextBlock(brand: BrandContext): string {
  const parts: string[] = []
  if (brand.voice) parts.push(`Brand Voice: ${brand.voice}`)
  if (brand.icp) parts.push(`ICP: ${brand.icp}`)
  if (brand.goals) parts.push(`Goals: ${brand.goals}`)
  if (Array.isArray(brand.services) && brand.services.length > 0)
    parts.push(`Services: ${JSON.stringify(brand.services)}`)
  if (Array.isArray(brand.competitors) && brand.competitors.length > 0)
    parts.push(`Competitors: ${JSON.stringify(brand.competitors)}`)
  if (Array.isArray(brand.keywords) && brand.keywords.length > 0)
    parts.push(`Keywords: ${JSON.stringify(brand.keywords)}`)
  return parts.join('\n')
}

export async function runBlogPipeline(input: PipelineInput) {
  const {
    runId,
    clientName,
    websiteUrl,
    targetKeyword,
    brandContext,
  } = input

  let clientDomain: string
  try {
    clientDomain = new URL(websiteUrl).hostname
  } catch {
    clientDomain = websiteUrl
  }

  try {
    // ═══ STEP 1: Scrape website ═══
    await updateRunStatus(runId, { status: 'researching' })
    const siteData = await scrapeWebsite(websiteUrl)

    // ═══ STEP 2: Research + Keywords + Outline (Call 1) ═══
    const brandBlock = buildBrandContextBlock(brandContext)

    const researchResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are an expert SEO strategist. You will receive a website URL, scraped website data, and a target keyword. Your job is to produce a research brief, supporting keywords, and content outline in one response.

Return ONLY valid JSON in this exact format:
{
  "blogTitle": "string — contains keyword, 50-60 chars, compelling",
  "supportingKeywords": ["array of 6-8 related keywords"],
  "contentOutline": "string — full outline with H2 and H3 structure. Use markdown ## for H2, ### for H3.",
  "searchIntent": "string — 1 sentence describing what user wants when searching this keyword"
}`,
      messages: [
        {
          role: 'user',
          content: `Target Keyword: ${targetKeyword}
Client Name: ${clientName}
Website URL: ${websiteUrl}

Scraped Website Data:
- Page Title: ${siteData.title}
- H1: ${siteData.h1}
- H2s: ${siteData.h2s.join(', ')}
- Body Text (excerpt): ${siteData.bodyText.slice(0, 1500)}
- Internal Links: ${siteData.internalLinks.slice(0, 10).join(', ')}

Brand Context:
${brandBlock}

Create a blog outline with 8-10 sections. Return ONLY valid JSON.`,
        },
      ],
    })

    const researchRaw =
      researchResponse.content[0].type === 'text'
        ? researchResponse.content[0].text
        : ''

    let research: {
      blogTitle: string
      supportingKeywords: string[]
      contentOutline: string
    }
    try {
      const jsonMatch = researchRaw.match(/\{[\s\S]*\}/)
      research = JSON.parse(jsonMatch?.[0] ?? '{}')
    } catch {
      await failRun(runId, 'Failed to parse research response')
      return
    }

    const supportingKeywords = research.supportingKeywords ?? []
    const blogTitle = research.blogTitle ?? `${targetKeyword} — Complete Guide`
    const contentOutline = research.contentOutline ?? ''

    await updateRunStatus(runId, {
      supporting_keywords: supportingKeywords,
      blog_title: blogTitle,
      content_outline: contentOutline,
      status: 'writing',
    })

    // ═══ STEP 3: Write Full Blog (Call 2) ═══
    const writeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: `You are an expert SEO content writer. Write a full SEO blog post in HTML format.

RULES:
- Return ONLY raw HTML — no markdown, no explanation
- Use <h1> for title (once only, contains target keyword)
- Use <h2> for main sections (minimum 4)
- Use <h3> for subsections where appropriate
- Use <p> for paragraphs (never one-sentence paragraphs)
- Use <ul> or <ol> for lists where natural
- Target word count: 1400-1800 words
- Target keyword density: 1.5-2% (roughly 20-25 mentions per 1500 words)
- Include target keyword in: H1, first paragraph, at least 2 H2s, conclusion
- Include ALL supporting keywords at least once each
- Add 2-3 internal links to the client's website using real anchor text (not 'click here')
- End with a strong CTA section as the final H2 using the full client name
- Write in the client's brand voice
- NO keyword stuffing — must read naturally

METADATA — append at the very end after the HTML in this exact format:
---META---
TITLE_TAG: [50-60 chars, contains keyword]
META_DESC: [150-160 chars, compelling, contains keyword]
SLUG: [lowercase-hyphenated-keyword-slug]`,
      messages: [
        {
          role: 'user',
          content: `Target Keyword: ${targetKeyword}
Blog Title: ${blogTitle}
Supporting Keywords: ${supportingKeywords.join(', ')}

Content Outline:
${contentOutline}

Client: ${clientName}
Website: ${websiteUrl}
Internal Links to use: ${siteData.internalLinks.slice(0, 10).join(', ')}

Brand Context:
${brandBlock}

Write the full blog now. Return ONLY raw HTML + metadata.`,
        },
      ],
    })

    const writeRaw =
      writeResponse.content[0].type === 'text'
        ? writeResponse.content[0].text
        : ''

    // Parse HTML and metadata
    const metaSplit = writeRaw.split('---META---')
    let blogHtml = metaSplit[0].trim()
    const metaBlock = metaSplit[1] ?? ''

    const titleTagMatch = metaBlock.match(/TITLE_TAG:\s*(.+)/i)
    const metaDescMatch = metaBlock.match(/META_DESC:\s*(.+)/i)
    const slugMatch = metaBlock.match(/SLUG:\s*(.+)/i)

    let titleTag = titleTagMatch?.[1]?.trim() ?? `${blogTitle} | ${clientName}`
    let metaDescription = metaDescMatch?.[1]?.trim() ?? ''
    let slug = slugMatch?.[1]?.trim() ?? targetKeyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const textOnly = blogHtml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    const wordCount = textOnly.split(/\s+/).filter(Boolean).length

    await updateRunStatus(runId, {
      blog_html: blogHtml,
      word_count: wordCount,
      title_tag: titleTag,
      meta_description: metaDescription,
      slug,
      status: 'humanizing',
    })

    // ═══ STEP 3.5: Humanize Content (Call 2.5) ═══
    blogHtml = await humanizeBlog({
      blogHtml,
      targetKeyword,
      supportingKeywords,
      clientUrl: websiteUrl,
    })

    // Recalculate word count after humanization
    const humanizedTextOnly = blogHtml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    const humanizedWordCount = humanizedTextOnly.split(/\s+/).filter(Boolean).length

    await updateRunStatus(runId, {
      blog_html: blogHtml,
      word_count: humanizedWordCount,
      status: 'qa_check',
    })

    // ═══ STEP 4: QA Checks ═══
    const qaResult: QAResult = runQAChecks({
      blogHtml,
      targetKeyword,
      supportingKeywords,
      titleTag,
      metaDescription,
      slug,
      schemaMarkup: '',
      clientDomain,
    })

    await updateRunStatus(runId, {
      qa_passed: qaResult.passed,
      qa_issues: qaResult.issues,
      qa_score: qaResult.score,
    })

    // ═══ STEP 5 (CONDITIONAL): Revision Pass ═══
    if (!qaResult.passed) {
      await updateRunStatus(runId, { status: 'revising' })

      const issuesList = qaResult.issues
        .map((i) => `[${i.severity.toUpperCase()}] ${i.code}: ${i.detail}`)
        .join('\n')

      const revisionResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: `You are revising a blog post that FAILED quality checks. Fix ALL listed issues. Return only the corrected HTML + metadata in the same format.

RULES:
- Return ONLY raw HTML — no markdown, no explanation
- Use <h1> for title (once only, contains target keyword)
- Use <h2> for main sections (minimum 4)
- Use <h3> for subsections where appropriate
- Use <p> for paragraphs (never one-sentence paragraphs)
- Target word count: 1400-1800 words
- Include target keyword in: H1, first paragraph, at least 2 H2s, conclusion
- Include ALL supporting keywords at least once each
- Add 2-3 internal links to the client's website
- End with a strong CTA section using the full client name
- NO keyword stuffing — must read naturally

METADATA — append at the very end after the HTML:
---META---
TITLE_TAG: [50-60 chars, contains keyword]
META_DESC: [150-160 chars, compelling, contains keyword]
SLUG: [lowercase-hyphenated-keyword-slug]`,
        messages: [
          {
            role: 'user',
            content: `FIX THESE ISSUES:
${issuesList}

ORIGINAL BLOG HTML:
${blogHtml}

Target Keyword: ${targetKeyword}
Supporting Keywords: ${supportingKeywords.join(', ')}
Client: ${clientName}
Website: ${websiteUrl}
Internal Links: ${siteData.internalLinks.slice(0, 10).join(', ')}

Fix every issue listed above. Return ONLY raw HTML + metadata.`,
          },
        ],
      })

      const revisionRaw =
        revisionResponse.content[0].type === 'text'
          ? revisionResponse.content[0].text
          : ''

      const revMetaSplit = revisionRaw.split('---META---')
      blogHtml = revMetaSplit[0].trim()
      const revMetaBlock = revMetaSplit[1] ?? ''

      const revTitleMatch = revMetaBlock.match(/TITLE_TAG:\s*(.+)/i)
      const revDescMatch = revMetaBlock.match(/META_DESC:\s*(.+)/i)
      const revSlugMatch = revMetaBlock.match(/SLUG:\s*(.+)/i)

      if (revTitleMatch) titleTag = revTitleMatch[1].trim()
      if (revDescMatch) metaDescription = revDescMatch[1].trim()
      if (revSlugMatch) slug = revSlugMatch[1].trim()

      const revTextOnly = blogHtml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
      const revWordCount = revTextOnly.split(/\s+/).filter(Boolean).length

      // Re-run QA on revised version
      const revisedQa = runQAChecks({
        blogHtml,
        targetKeyword,
        supportingKeywords,
        titleTag,
        metaDescription,
        slug,
        schemaMarkup: '',
        clientDomain,
      })

      await updateRunStatus(runId, {
        blog_html: blogHtml,
        word_count: revWordCount,
        title_tag: titleTag,
        meta_description: metaDescription,
        slug,
        qa_passed: revisedQa.passed,
        qa_issues: revisedQa.issues,
        qa_score: revisedQa.score,
        revision_applied: true,
      })
    }

    // ═══ STEP 6: Schema Markup (Call 4 — Haiku) ═══
    const today = new Date().toISOString().split('T')[0]

    const schemaResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20250929',
      max_tokens: 500,
      system: 'Generate BlogPosting JSON-LD schema markup. Return ONLY the JSON — no explanation.',
      messages: [
        {
          role: 'user',
          content: `Generate JSON-LD schema for:
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${blogTitle}",
  "description": "${metaDescription}",
  "author": { "@type": "Organization", "name": "${clientName}" },
  "publisher": { "@type": "Organization", "name": "${clientName}", "url": "${websiteUrl}" },
  "url": "${websiteUrl}/blog/${slug}",
  "datePublished": "${today}",
  "mainEntityOfPage": "${websiteUrl}/blog/${slug}"
}

Return ONLY valid JSON.`,
        },
      ],
    })

    const schemaRaw =
      schemaResponse.content[0].type === 'text'
        ? schemaResponse.content[0].text
        : ''

    let schemaMarkup = schemaRaw.trim()
    // Try to extract JSON if wrapped in code block
    const schemaJsonMatch = schemaMarkup.match(/\{[\s\S]*\}/)
    if (schemaJsonMatch) {
      schemaMarkup = schemaJsonMatch[0]
    }

    // ═══ COMPLETE ═══
    await updateRunStatus(runId, {
      schema_markup: schemaMarkup,
      status: 'complete',
      completed_at: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pipeline failed'
    await failRun(runId, message)
  }
}
