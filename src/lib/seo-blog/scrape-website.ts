export interface WebsiteData {
  title: string
  metaDescription: string
  h1: string
  h2s: string[]
  bodyText: string
  internalLinks: string[]
}

export async function scrapeWebsite(url: string): Promise<WebsiteData> {
  const empty: WebsiteData = {
    title: '',
    metaDescription: '',
    h1: '',
    h2s: [],
    bodyText: '',
    internalLinks: [],
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIMarketingBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return empty

    const html = await res.text()
    let hostname: string
    try {
      hostname = new URL(url).hostname
    } catch {
      return empty
    }

    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''

    // Meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*\/?>/i)
      ?? html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*\/?>/i)
    const metaDescription = metaMatch ? metaMatch[1].trim() : ''

    // H1
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    const h1 = h1Match ? stripTags(h1Match[1]).trim() : ''

    // H2s (max 10)
    const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi
    const h2s: string[] = []
    let h2Match: RegExpExecArray | null
    while ((h2Match = h2Regex.exec(html)) !== null && h2s.length < 10) {
      const text = stripTags(h2Match[1]).trim()
      if (text) h2s.push(text)
    }

    // Body text (first 3000 chars)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    const bodyRaw = bodyMatch ? bodyMatch[1] : html
    const bodyText = stripTags(
      bodyRaw
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    )
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)

    // Internal links (max 20)
    const linkRegex = /href=["'](https?:\/\/[^"']*?)["']/gi
    const internalLinks: string[] = []
    let linkMatch: RegExpExecArray | null
    while ((linkMatch = linkRegex.exec(html)) !== null && internalLinks.length < 20) {
      try {
        const linkUrl = new URL(linkMatch[1])
        if (linkUrl.hostname === hostname || linkUrl.hostname.endsWith('.' + hostname)) {
          const full = linkUrl.href
          if (!internalLinks.includes(full)) {
            internalLinks.push(full)
          }
        }
      } catch {
        // skip invalid URLs
      }
    }

    return { title, metaDescription, h1, h2s, bodyText, internalLinks }
  } catch {
    return empty
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}
