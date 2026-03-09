import type { BlogPageData } from './scrape-page'
import type { AuditCheck, AuditCategory, BlogAuditResult } from '@/types/blog-audit'

function containsKeyword(text: string, keyword: string): boolean {
  return text.toLowerCase().includes(keyword.toLowerCase())
}

function countKeyword(text: string, keyword: string): number {
  const lower = text.toLowerCase()
  const kw = keyword.toLowerCase()
  let count = 0
  let idx = 0
  while ((idx = lower.indexOf(kw, idx)) !== -1) {
    count++
    idx += kw.length
  }
  return count
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function runBlogAudit(
  pageData: BlogPageData,
  targetKeyword: string,
  runId: string
): BlogAuditResult {
  const categories: AuditCategory[] = []

  // ═══ CATEGORY 1: On-Page SEO (max 30) ═══
  const onPageChecks: AuditCheck[] = []
  let onPageScore = 0

  // Keyword in title
  const kwInTitle = containsKeyword(pageData.title, targetKeyword)
  onPageChecks.push({
    code: 'TITLE_KW',
    label: 'Keyword in title tag',
    status: kwInTitle ? 'pass' : 'fail',
    severity: 'critical',
    detail: kwInTitle
      ? `Title contains "${targetKeyword}"`
      : `Title "${pageData.title}" does not contain the target keyword`,
    howToFix: kwInTitle ? undefined : `Add "${targetKeyword}" to your <title> tag, ideally near the beginning.`,
  })
  if (kwInTitle) onPageScore += 5

  // Keyword in H1
  const kwInH1 = pageData.h1s.some((h) => containsKeyword(h, targetKeyword))
  onPageChecks.push({
    code: 'H1_KW',
    label: 'Keyword in H1',
    status: kwInH1 ? 'pass' : 'fail',
    severity: 'critical',
    detail: kwInH1
      ? 'H1 contains the target keyword'
      : `H1${pageData.h1s.length > 0 ? ` "${pageData.h1s[0]}"` : ' (none found)'} does not contain the keyword`,
    howToFix: kwInH1 ? undefined : `Include "${targetKeyword}" in your main H1 heading.`,
  })
  if (kwInH1) onPageScore += 5

  // Keyword in meta description
  const kwInMeta = containsKeyword(pageData.metaDescription, targetKeyword)
  onPageChecks.push({
    code: 'META_KW',
    label: 'Keyword in meta description',
    status: kwInMeta ? 'pass' : 'fail',
    severity: 'critical',
    detail: kwInMeta
      ? 'Meta description contains the target keyword'
      : 'Meta description does not contain the target keyword',
    howToFix: kwInMeta ? undefined : `Add "${targetKeyword}" to your meta description for better click-through rates.`,
  })
  if (kwInMeta) onPageScore += 5

  // Keyword in first 100 words
  const first100 = pageData.bodyText.split(/\s+/).slice(0, 100).join(' ')
  const kwInFirst100 = containsKeyword(first100, targetKeyword)
  onPageChecks.push({
    code: 'INTRO_KW',
    label: 'Keyword in first 100 words',
    status: kwInFirst100 ? 'pass' : 'fail',
    severity: 'warning',
    detail: kwInFirst100
      ? 'Target keyword appears in the opening paragraph'
      : 'Target keyword is missing from the first 100 words',
    howToFix: kwInFirst100 ? undefined : 'Mention the target keyword naturally within your first paragraph.',
  })
  if (kwInFirst100) onPageScore += 5

  // Keyword in at least 2 H2s
  const h2sWithKw = pageData.h2s.filter((h) => containsKeyword(h, targetKeyword))
  const kwIn2H2s = h2sWithKw.length >= 2
  onPageChecks.push({
    code: 'H2_KW',
    label: 'Keyword in at least 2 H2s',
    status: kwIn2H2s ? 'pass' : h2sWithKw.length === 1 ? 'warning' : 'fail',
    severity: 'warning',
    detail: `${h2sWithKw.length} of ${pageData.h2s.length} H2 headings contain the keyword`,
    howToFix: kwIn2H2s ? undefined : `Include "${targetKeyword}" in at least 2 H2 section headings.`,
  })
  if (kwIn2H2s) onPageScore += 5

  // Keyword in URL/slug
  const kwInUrl = containsKeyword(pageData.url, targetKeyword.replace(/\s+/g, '-'))
    || containsKeyword(pageData.url, targetKeyword)
  onPageChecks.push({
    code: 'URL_KW',
    label: 'Keyword in URL',
    status: kwInUrl ? 'pass' : 'fail',
    severity: 'warning',
    detail: kwInUrl
      ? 'URL contains the target keyword'
      : 'URL does not contain the target keyword',
    howToFix: kwInUrl ? undefined : `Use a URL slug that includes "${targetKeyword.replace(/\s+/g, '-').toLowerCase()}".`,
  })
  if (kwInUrl) onPageScore += 5

  categories.push({
    id: 'on-page-seo',
    label: 'On-Page SEO',
    score: onPageScore,
    maxScore: 30,
    checks: onPageChecks,
  })

  // ═══ CATEGORY 2: Content Quality (max 25) ═══
  const contentChecks: AuditCheck[] = []
  let contentScore = 0

  // Word count
  const wc = pageData.wordCount
  const wcGood = wc >= 1200 && wc <= 2000
  const wcPartial = wc >= 800 && wc < 1200
  contentChecks.push({
    code: 'WORD_COUNT',
    label: 'Word count 1200-2000',
    status: wcGood ? 'pass' : wcPartial ? 'warning' : 'fail',
    severity: 'critical',
    detail: `${wc.toLocaleString()} words${wcGood ? ' (optimal range)' : wc > 2000 ? ' (above optimal, may be fine)' : ' (below target)'}`,
    howToFix: wcGood || wc > 2000 ? undefined : 'Expand your content to at least 1,200 words for better SEO performance.',
  })
  if (wcGood || wc > 2000) contentScore += 10
  else if (wcPartial) contentScore += 5

  // H2 count
  const hasEnoughH2 = pageData.h2s.length >= 3
  contentChecks.push({
    code: 'H2_COUNT',
    label: 'At least 3 H2 headings',
    status: hasEnoughH2 ? 'pass' : 'fail',
    severity: 'warning',
    detail: `${pageData.h2s.length} H2 headings found`,
    howToFix: hasEnoughH2 ? undefined : 'Add more H2 section headings to improve content structure and scannability.',
  })
  if (hasEnoughH2) contentScore += 5

  // H3 subheadings
  const hasH3 = pageData.h3s.length > 0
  contentChecks.push({
    code: 'H3_PRESENT',
    label: 'Has H3 subheadings',
    status: hasH3 ? 'pass' : 'warning',
    severity: 'info',
    detail: hasH3 ? `${pageData.h3s.length} H3 subheadings found` : 'No H3 subheadings found',
    howToFix: hasH3 ? undefined : 'Add H3 subheadings under your H2 sections for better content hierarchy.',
  })
  if (hasH3) contentScore += 5

  // CTA section
  const bodyLower = pageData.bodyText.toLowerCase()
  const hasCta = bodyLower.includes('contact us') || bodyLower.includes('get started') ||
    bodyLower.includes('sign up') || bodyLower.includes('learn more') ||
    bodyLower.includes('schedule') || bodyLower.includes('book a') ||
    bodyLower.includes('free trial') || bodyLower.includes('request a')
  contentChecks.push({
    code: 'HAS_CTA',
    label: 'Has a call-to-action',
    status: hasCta ? 'pass' : 'fail',
    severity: 'warning',
    detail: hasCta ? 'CTA detected in content' : 'No clear call-to-action found',
    howToFix: hasCta ? undefined : 'Add a clear CTA section at the end of your blog post.',
  })
  if (hasCta) contentScore += 5

  categories.push({
    id: 'content-quality',
    label: 'Content Quality',
    score: contentScore,
    maxScore: 25,
    checks: contentChecks,
  })

  // ═══ CATEGORY 3: Technical SEO (max 20) ═══
  const techChecks: AuditCheck[] = []
  let techScore = 0

  // Canonical tag
  const hasCanonical = !!pageData.canonicalUrl
  techChecks.push({
    code: 'HAS_CANONICAL',
    label: 'Has canonical tag',
    status: hasCanonical ? 'pass' : 'fail',
    severity: 'warning',
    detail: hasCanonical ? `Canonical: ${pageData.canonicalUrl}` : 'No canonical tag found',
    howToFix: hasCanonical ? undefined : 'Add a <link rel="canonical"> tag to prevent duplicate content issues.',
  })
  if (hasCanonical) techScore += 5

  // Schema markup
  const hasSchema = pageData.schemaBlocks.length > 0
  const schemaTypes = pageData.schemaBlocks.map((s) => s.type)
  const hasBlogSchema = schemaTypes.some(
    (t) => t === 'BlogPosting' || t === 'Article' || t === 'NewsArticle'
  )
  techChecks.push({
    code: 'HAS_SCHEMA',
    label: 'Has schema markup',
    status: hasBlogSchema ? 'pass' : hasSchema ? 'warning' : 'fail',
    severity: 'critical',
    detail: hasBlogSchema
      ? `BlogPosting/Article schema found (${schemaTypes.join(', ')})`
      : hasSchema
        ? `Schema found but not BlogPosting type (${schemaTypes.join(', ')})`
        : 'No JSON-LD schema markup found',
    howToFix: hasBlogSchema
      ? undefined
      : 'Add a BlogPosting or Article JSON-LD schema to help search engines understand your content.',
  })
  // BlogPosting/Article = 8 points, other schema = 8 points base, no schema = 0
  if (hasBlogSchema) techScore += 8
  else if (hasSchema) techScore += 8

  // Bonus for BlogPosting type (replaces base and gives 7 extra = total 15 from schema)
  if (hasBlogSchema) {
    techScore += 7
    techChecks.push({
      code: 'SCHEMA_TYPE',
      label: 'Schema is BlogPosting/Article',
      status: 'pass',
      severity: 'info',
      detail: `Correct schema type: ${schemaTypes.filter((t) => ['BlogPosting', 'Article', 'NewsArticle'].includes(t)).join(', ')}`,
    })
  }

  // No duplicate H1s
  const noDupeH1 = pageData.h1s.length <= 1
  techChecks.push({
    code: 'SINGLE_H1',
    label: 'No duplicate H1s',
    status: noDupeH1 ? 'pass' : 'fail',
    severity: 'warning',
    detail: noDupeH1
      ? `${pageData.h1s.length} H1 tag found`
      : `${pageData.h1s.length} H1 tags found — should only be 1`,
    howToFix: noDupeH1 ? undefined : 'Use only one H1 tag per page. Convert extras to H2.',
  })
  if (noDupeH1) techScore += 5

  categories.push({
    id: 'technical-seo',
    label: 'Technical SEO',
    score: Math.min(techScore, 20),
    maxScore: 20,
    checks: techChecks,
  })

  // ═══ CATEGORY 4: Links (max 15) ═══
  const linkChecks: AuditCheck[] = []
  let linkScore = 0

  const intCount = pageData.internalLinks.length
  const hasInternal = intCount >= 1
  const hasManyInternal = intCount >= 2
  linkChecks.push({
    code: 'INT_LINKS_1',
    label: 'Has at least 1 internal link',
    status: hasInternal ? 'pass' : 'fail',
    severity: 'critical',
    detail: `${intCount} internal link${intCount !== 1 ? 's' : ''} found`,
    howToFix: hasInternal ? undefined : 'Add internal links to other relevant pages on your site.',
  })
  if (hasInternal) linkScore += 5

  linkChecks.push({
    code: 'INT_LINKS_2',
    label: 'Has 2+ internal links',
    status: hasManyInternal ? 'pass' : 'warning',
    severity: 'warning',
    detail: hasManyInternal ? `${intCount} internal links (good)` : 'Fewer than 2 internal links',
    howToFix: hasManyInternal ? undefined : 'Add at least 2 internal links for better site structure and SEO.',
  })
  if (hasManyInternal) linkScore += 5

  const extCount = pageData.externalLinks.length
  const hasExternal = extCount >= 1
  linkChecks.push({
    code: 'EXT_LINKS',
    label: 'Has at least 1 external link',
    status: hasExternal ? 'pass' : 'warning',
    severity: 'info',
    detail: `${extCount} external link${extCount !== 1 ? 's' : ''} found`,
    howToFix: hasExternal ? undefined : 'Link to authoritative external sources to build trust and context.',
  })
  if (hasExternal) linkScore += 5

  categories.push({
    id: 'links',
    label: 'Links',
    score: linkScore,
    maxScore: 15,
    checks: linkChecks,
  })

  // ═══ CATEGORY 5: Media & Accessibility (max 10) ═══
  const mediaChecks: AuditCheck[] = []
  let mediaScore = 0

  const hasImages = pageData.imageCount > 0
  mediaChecks.push({
    code: 'HAS_IMAGES',
    label: 'Has at least 1 image',
    status: hasImages ? 'pass' : 'fail',
    severity: 'warning',
    detail: `${pageData.imageCount} image${pageData.imageCount !== 1 ? 's' : ''} found`,
    howToFix: hasImages ? undefined : 'Add relevant images to break up text and improve engagement.',
  })
  if (hasImages) mediaScore += 5

  const allHaveAlt = hasImages && pageData.imagesMissingAlt === 0
  const someHaveAlt = hasImages && pageData.imagesMissingAlt < pageData.imageCount
  mediaChecks.push({
    code: 'IMG_ALT',
    label: 'All images have alt text',
    status: allHaveAlt ? 'pass' : someHaveAlt ? 'warning' : hasImages ? 'fail' : 'warning',
    severity: 'warning',
    detail: !hasImages
      ? 'No images to check'
      : allHaveAlt
        ? 'All images have alt attributes'
        : `${pageData.imagesMissingAlt} of ${pageData.imageCount} images missing alt text`,
    howToFix: allHaveAlt || !hasImages
      ? undefined
      : 'Add descriptive alt text to all images for accessibility and SEO.',
  })
  if (allHaveAlt) mediaScore += 5
  else if (someHaveAlt) mediaScore += 3

  categories.push({
    id: 'media',
    label: 'Media & Accessibility',
    score: mediaScore,
    maxScore: 10,
    checks: mediaChecks,
  })

  // ═══ TOTALS ═══
  const overallScore = categories.reduce((sum, c) => sum + c.score, 0)
  const grade = getGrade(overallScore)

  // Keyword stats
  const keywordCount = countKeyword(pageData.bodyText, targetKeyword)
  const keywordDensity = pageData.wordCount > 0
    ? ((keywordCount / pageData.wordCount) * 100).toFixed(1)
    : '0.0'

  // Priority fixes — all failed critical checks sorted by impact
  const priorityFixes: AuditCheck[] = []
  for (const cat of categories) {
    for (const check of cat.checks) {
      if (check.status === 'fail' && (check.severity === 'critical' || check.severity === 'warning')) {
        priorityFixes.push(check)
      }
    }
  }
  // Sort critical before warning
  priorityFixes.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1
    if (a.severity !== 'critical' && b.severity === 'critical') return 1
    return 0
  })

  const schemaType = pageData.schemaBlocks.length > 0
    ? pageData.schemaBlocks.map((s) => s.type).join(', ')
    : null

  return {
    runId,
    pageUrl: pageData.url,
    targetKeyword,
    overallScore,
    grade,
    categories,
    priorityFixes: priorityFixes.slice(0, 5),
    recommendations: '',
    stats: {
      wordCount: pageData.wordCount,
      keywordCount,
      keywordDensity: `${keywordDensity}%`,
      h1Count: pageData.h1s.length,
      h2Count: pageData.h2s.length,
      h3Count: pageData.h3s.length,
      internalLinks: pageData.internalLinks.length,
      externalLinks: pageData.externalLinks.length,
      images: pageData.imageCount,
      imagesMissingAlt: pageData.imagesMissingAlt,
      hasSchema: pageData.schemaBlocks.length > 0,
      schemaType,
      hasCanonical: !!pageData.canonicalUrl,
    },
  }
}

export { runBlogAudit }
