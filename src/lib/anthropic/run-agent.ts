import Anthropic from '@anthropic-ai/sdk'
import type { AuditAgentResult, AuditDimension, BrandContext } from '@/types/audit'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

function buildBrandContextPrompt(brand: BrandContext): string {
  const parts: string[] = []

  if (brand.voice) parts.push(`Brand Voice: ${brand.voice}`)
  if (brand.icp) parts.push(`Ideal Customer Profile: ${brand.icp}`)
  if (brand.goals) parts.push(`Marketing Goals: ${brand.goals}`)

  if (Array.isArray(brand.services) && brand.services.length > 0) {
    parts.push(`Services: ${JSON.stringify(brand.services)}`)
  }
  if (Array.isArray(brand.competitors) && brand.competitors.length > 0) {
    parts.push(`Competitors: ${JSON.stringify(brand.competitors)}`)
  }
  if (Array.isArray(brand.keywords) && brand.keywords.length > 0) {
    parts.push(`Target Keywords: ${JSON.stringify(brand.keywords)}`)
  }
  if (brand.additional_context) {
    parts.push(`Additional Context: ${brand.additional_context}`)
  }

  return parts.join('\n\n')
}

const AGENT_PROMPTS: Record<AuditDimension, string> = {
  seo: `You are an expert SEO auditor. Analyze the brand's SEO strategy based on their brand context, target keywords, competitors, and goals.

Evaluate:
- Keyword strategy and targeting
- On-page SEO potential (title tags, meta descriptions, headers)
- Content gap analysis vs competitors
- Technical SEO considerations (site structure, URL patterns)
- Backlink and authority opportunities

Return your analysis as valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "findings": ["<finding 1>", "<finding 2>", ...],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}

Provide 5-8 findings and 5-8 actionable recommendations. Be specific and reference the brand context.`,

  content: `You are an expert content marketing auditor. Analyze the brand's content strategy based on their brand context, voice, ICP, and goals.

Evaluate:
- Content-market fit for their ICP
- Brand voice consistency and effectiveness
- Content gaps and opportunities
- Content types that would resonate with their audience
- Competitor content differentiation

Return your analysis as valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "findings": ["<finding 1>", "<finding 2>", ...],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}

Provide 5-8 findings and 5-8 actionable recommendations. Be specific and reference the brand context.`,

  technical: `You are an expert technical marketing auditor. Analyze the brand's technical marketing infrastructure based on their brand context and goals.

Evaluate:
- Website performance and user experience implications
- Conversion rate optimization opportunities
- Analytics and tracking setup recommendations
- Marketing automation opportunities
- Technical debt and quick wins

Return your analysis as valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "findings": ["<finding 1>", "<finding 2>", ...],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}

Provide 5-8 findings and 5-8 actionable recommendations. Be specific and reference the brand context.`,
}

export async function runAuditAgent(
  dimension: AuditDimension,
  brandContext: BrandContext,
  clientName: string,
  websiteUrl: string | null
): Promise<AuditAgentResult> {
  const brandPrompt = buildBrandContextPrompt(brandContext)
  const siteInfo = websiteUrl ? `\nWebsite: ${websiteUrl}` : ''

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: AGENT_PROMPTS[dimension],
    messages: [
      {
        role: 'user',
        content: `Perform a ${dimension} audit for the following brand:\n\nClient: ${clientName}${siteInfo}\n\n${brandPrompt}\n\nReturn ONLY valid JSON, no other text.`,
      },
    ],
  })

  const rawOutput =
    message.content[0].type === 'text' ? message.content[0].text : ''

  const tokensUsed =
    (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0)

  let parsed: { score: number; findings: string[]; recommendations: string[] }
  try {
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch?.[0] ?? '{}')
  } catch {
    parsed = {
      score: 0,
      findings: ['Failed to parse audit results.'],
      recommendations: ['Please re-run the audit.'],
    }
  }

  return {
    dimension,
    score: Math.min(100, Math.max(0, parsed.score ?? 0)),
    findings: parsed.findings ?? [],
    recommendations: parsed.recommendations ?? [],
    tokensUsed,
    rawOutput,
  }
}

export async function runParallelAudit(
  dimensions: AuditDimension[],
  brandContext: BrandContext,
  clientName: string,
  websiteUrl: string | null
): Promise<AuditAgentResult[]> {
  const results = await Promise.all(
    dimensions.map((dim) =>
      runAuditAgent(dim, brandContext, clientName, websiteUrl)
    )
  )
  return results
}
