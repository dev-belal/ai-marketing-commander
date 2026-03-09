import type { QAIssue, QAResult } from '@/types/seo-blog'

interface QAParams {
  blogHtml: string
  targetKeyword: string
  supportingKeywords: string[]
  titleTag: string
  metaDescription: string
  slug: string
  schemaMarkup: string
  clientDomain: string
}

export function runQAChecks(params: QAParams): QAResult {
  const {
    blogHtml,
    targetKeyword,
    supportingKeywords,
    titleTag,
    metaDescription,
    slug,
    schemaMarkup,
    clientDomain,
  } = params

  const issues: QAIssue[] = []
  const lowerHtml = blogHtml.toLowerCase()
  const lowerKeyword = targetKeyword.toLowerCase()
  const textContent = stripTags(blogHtml).replace(/\s+/g, ' ').trim()
  const wordCount = textContent.split(/\s+/).filter(Boolean).length

  // Extract elements
  const h1Matches = blogHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) ?? []
  const h2Matches = blogHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) ?? []
  const h1Count = h1Matches.length
  const h2Count = h2Matches.length

  // Count keyword occurrences in text
  const keywordRegex = new RegExp(escapeRegex(lowerKeyword), 'gi')
  const keywordCount = (textContent.match(keywordRegex) ?? []).length

  // Count internal links
  const linkRegex = new RegExp(`href=["'][^"']*${escapeRegex(clientDomain)}[^"']*["']`, 'gi')
  const internalLinkCount = (blogHtml.match(linkRegex) ?? []).length

  // ═══════════════ CRITICAL CHECKS (-15) ═══════════════

  // 1. WORD_COUNT_LOW
  if (wordCount < 1200) {
    issues.push({ code: 'WORD_COUNT_LOW', severity: 'critical', detail: `Word count is ${wordCount} (minimum 1200)` })
  }

  // 2. WORD_COUNT_HIGH
  if (wordCount > 2000) {
    issues.push({ code: 'WORD_COUNT_HIGH', severity: 'critical', detail: `Word count is ${wordCount} (maximum 2000)` })
  }

  // 3. KEYWORD_MISSING_H1
  const h1Text = h1Matches.map((h) => stripTags(h).toLowerCase()).join(' ')
  if (!h1Text.includes(lowerKeyword)) {
    issues.push({ code: 'KEYWORD_MISSING_H1', severity: 'critical', detail: `Target keyword "${targetKeyword}" not found in H1` })
  }

  // 4. KEYWORD_MISSING_TITLE_TAG
  if (!titleTag.toLowerCase().includes(lowerKeyword)) {
    issues.push({ code: 'KEYWORD_MISSING_TITLE_TAG', severity: 'critical', detail: `Target keyword not in title tag` })
  }

  // 5. META_DESC_LENGTH
  if (metaDescription.length < 150 || metaDescription.length > 160) {
    issues.push({ code: 'META_DESC_LENGTH', severity: 'critical', detail: `Meta description is ${metaDescription.length} chars (should be 150-160)` })
  }

  // 6. TITLE_TAG_LENGTH
  if (titleTag.length < 50 || titleTag.length > 60) {
    issues.push({ code: 'TITLE_TAG_LENGTH', severity: 'critical', detail: `Title tag is ${titleTag.length} chars (should be 50-60)` })
  }

  // 7. NO_H2S
  if (h2Count < 3) {
    issues.push({ code: 'NO_H2S', severity: 'critical', detail: `Only ${h2Count} H2 headings (minimum 3)` })
  }

  // 8. KEYWORD_TOO_FEW
  if (keywordCount < 8) {
    issues.push({ code: 'KEYWORD_TOO_FEW', severity: 'critical', detail: `Keyword appears ${keywordCount} times (minimum 8)` })
  }

  // 9. KEYWORD_STUFFING
  if (keywordCount > 30) {
    issues.push({ code: 'KEYWORD_STUFFING', severity: 'critical', detail: `Keyword appears ${keywordCount} times (maximum 30)` })
  }

  // 10. NO_INTERNAL_LINKS
  if (internalLinkCount === 0) {
    issues.push({ code: 'NO_INTERNAL_LINKS', severity: 'critical', detail: `No links to client domain (${clientDomain})` })
  }

  // ═══════════════ WARNING CHECKS (-5) ═══════════════

  // 11. NO_H1
  if (h1Count === 0) {
    issues.push({ code: 'NO_H1', severity: 'warning', detail: 'Missing H1 tag' })
  }

  // 12. MULTIPLE_H1
  if (h1Count > 1) {
    issues.push({ code: 'MULTIPLE_H1', severity: 'warning', detail: `${h1Count} H1 tags found (should be 1)` })
  }

  // 13. SUPPORTING_KW_MISSING
  if (supportingKeywords.length > 0) {
    const found = supportingKeywords.filter((kw) => lowerHtml.includes(kw.toLowerCase()))
    const ratio = found.length / supportingKeywords.length
    if (ratio < 0.5) {
      issues.push({
        code: 'SUPPORTING_KW_MISSING',
        severity: 'warning',
        detail: `Only ${found.length}/${supportingKeywords.length} supporting keywords appear in content`,
      })
    }
  }

  // 14. NO_CTA
  const ctaPhrases = ['contact us', 'call', 'get started', 'schedule', 'book', 'learn more', 'reach out', 'get in touch']
  const hasCta = ctaPhrases.some((phrase) => lowerHtml.includes(phrase))
  if (!hasCta) {
    issues.push({ code: 'NO_CTA', severity: 'warning', detail: 'No call to action detected' })
  }

  // 15. SLUG_TOO_LONG
  if (slug.length > 60) {
    issues.push({ code: 'SLUG_TOO_LONG', severity: 'warning', detail: `Slug is ${slug.length} chars (maximum 60)` })
  }

  // 16. SLUG_MISSING_KEYWORD
  if (!slug.toLowerCase().includes(lowerKeyword.replace(/\s+/g, '-'))) {
    issues.push({ code: 'SLUG_MISSING_KEYWORD', severity: 'warning', detail: 'Target keyword not in slug' })
  }

  // 17. SCHEMA_MISSING
  if (!schemaMarkup || schemaMarkup.trim().length === 0) {
    issues.push({ code: 'SCHEMA_MISSING', severity: 'warning', detail: 'No schema markup present' })
  }

  // 18. INTRO_KEYWORD_MISSING
  const first100Words = textContent.split(/\s+/).slice(0, 100).join(' ').toLowerCase()
  if (!first100Words.includes(lowerKeyword)) {
    issues.push({ code: 'INTRO_KEYWORD_MISSING', severity: 'warning', detail: 'Target keyword not in first 100 words' })
  }

  // 19. CONCLUSION_MISSING
  const h2Texts = h2Matches.map((h) => stripTags(h).toLowerCase())
  const conclusionKeywords = ['conclusion', 'summary', 'takeaway', 'next steps', 'final thoughts']
  const hasConclusion = h2Texts.some((t) => conclusionKeywords.some((ck) => t.includes(ck)))
  if (!hasConclusion) {
    issues.push({ code: 'CONCLUSION_MISSING', severity: 'warning', detail: 'No conclusion section detected' })
  }

  // 20. SHORT_PARAGRAPHS
  const paragraphs = (blogHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) ?? [])
    .map((p) => stripTags(p).trim())
    .filter((p) => p.length > 0)
  if (paragraphs.length > 0) {
    const avgWords = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / paragraphs.length
    if (avgWords < 40) {
      issues.push({ code: 'SHORT_PARAGRAPHS', severity: 'warning', detail: `Average paragraph is ${Math.round(avgWords)} words (minimum 40)` })
    }
  }

  // Calculate score
  let score = 100
  for (const issue of issues) {
    score -= issue.severity === 'critical' ? 15 : 5
  }
  score = Math.max(0, score)

  return {
    passed: score >= 70,
    score,
    issues,
    wordCount,
    keywordCount,
    h1Count,
    h2Count,
    internalLinkCount,
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
