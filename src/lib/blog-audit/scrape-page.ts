export interface BlogPageData {
  url: string
  title: string
  metaDescription: string
  canonicalUrl: string | null
  h1s: string[]
  h2s: string[]
  h3s: string[]
  bodyText: string
  wordCount: number
  internalLinks: string[]
  externalLinks: string[]
  imageCount: number
  imagesMissingAlt: number
  schemaBlocks: SchemaBlock[]
  fullHtml: string
  error: string | null
}

export interface SchemaBlock {
  type: string
  raw: string
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

function extractAll(html: string, regex: RegExp, maxCount = 50): string[] {
  const results: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null && results.length < maxCount) {
    const text = stripTags(match[1]).trim()
    if (text) results.push(text)
  }
  return results
}

async function scrapeBlogPage(url: string): Promise<BlogPageData> {
  const empty: BlogPageData = {
    url,
    title: '',
    metaDescription: '',
    canonicalUrl: null,
    h1s: [],
    h2s: [],
    h3s: [],
    bodyText: '',
    wordCount: 0,
    internalLinks: [],
    externalLinks: [],
    imageCount: 0,
    imagesMissingAlt: 0,
    schemaBlocks: [],
    fullHtml: '',
    error: null,
  }

  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return { ...empty, error: 'Invalid URL' }
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIMarketingBot/1.0)' },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return { ...empty, error: `HTTP ${res.status}: ${res.statusText}` }
    }

    const html = await res.text()

    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''

    // Meta description
    const metaMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*\/?>/i) ??
      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*\/?>/i)
    const metaDescription = metaMatch ? metaMatch[1].trim() : ''

    // Canonical URL
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([\s\S]*?)["'][^>]*\/?>/i) ??
      html.match(/<link[^>]*href=["']([\s\S]*?)["'][^>]*rel=["']canonical["'][^>]*\/?>/i)
    const canonicalUrl = canonicalMatch ? canonicalMatch[1].trim() : null

    // Headings
    const h1s = extractAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi)
    const h2s = extractAll(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi)
    const h3s = extractAll(html, /<h3[^>]*>([\s\S]*?)<\/h3>/gi)

    // Body text
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    const bodyRaw = bodyMatch ? bodyMatch[1] : html
    const bodyText = stripTags(
      bodyRaw
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    )
      .replace(/\s+/g, ' ')
      .trim()

    const wordCount = bodyText.split(/\s+/).filter(Boolean).length

    // Links — internal vs external
    const linkRegex = /href=["'](https?:\/\/[^"']*?)["']/gi
    const internalLinks: string[] = []
    const externalLinks: string[] = []
    let linkMatch: RegExpExecArray | null
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      try {
        const linkUrl = new URL(linkMatch[1])
        const isInternal = linkUrl.hostname === hostname || linkUrl.hostname.endsWith('.' + hostname)
        const href = linkUrl.href
        if (isInternal) {
          if (!internalLinks.includes(href)) internalLinks.push(href)
        } else {
          if (!externalLinks.includes(href)) externalLinks.push(href)
        }
      } catch {
        // skip invalid URLs
      }
    }

    // Images
    const imgRegex = /<img[^>]*>/gi
    let imageCount = 0
    let imagesMissingAlt = 0
    let imgMatch: RegExpExecArray | null
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      imageCount++
      const tag = imgMatch[0]
      const hasAlt = /alt=["'][^"']+["']/i.test(tag)
      if (!hasAlt) imagesMissingAlt++
    }

    // Schema markup (JSON-LD)
    const schemaBlocks: SchemaBlock[] = []
    const schemaRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let schemaMatch: RegExpExecArray | null
    while ((schemaMatch = schemaRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(schemaMatch[1])
        const schemaType = parsed['@type'] ?? 'Unknown'
        schemaBlocks.push({ type: schemaType, raw: schemaMatch[1].trim() })
      } catch {
        schemaBlocks.push({ type: 'Invalid JSON', raw: schemaMatch[1].trim() })
      }
    }

    return {
      url,
      title,
      metaDescription,
      canonicalUrl,
      h1s,
      h2s,
      h3s,
      bodyText,
      wordCount,
      internalLinks,
      externalLinks,
      imageCount,
      imagesMissingAlt,
      schemaBlocks,
      fullHtml: html,
      error: null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch page'
    return { ...empty, error: message }
  }
}

export { scrapeBlogPage }
