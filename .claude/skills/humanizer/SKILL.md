# Content Humanizer Skill

## Purpose
Transform AI-generated content into natural, human-sounding writing that bypasses AI detection tools (GPTZero, Originality.ai, Copyleaks, Winston AI) while maintaining full SEO integrity, keyword density, and factual accuracy.

---

## When to Apply
Apply this skill to ALL blog content after initial generation, before QA checks. The humanizer runs as a dedicated post-processing pass — never attempt to humanize and write simultaneously.

---

## The Core Problem With AI Writing

AI-generated content fails detection checks because of these consistent patterns:

| AI Pattern | Human Alternative |
|---|---|
| Perfect paragraph symmetry | Varied paragraph lengths (1 line to 6 lines) |
| Every sentence complete and polished | Mix in fragments. Like this. |
| Formal connectors (Furthermore, Moreover, Additionally) | Casual connectors (And, But, So, Plus) |
| Passive constructions | Direct active voice |
| Abstract openers ("It is important to note...") | Concrete openers ("Here's the thing:") |
| Uniform sentence length | Short. Then a longer sentence that gives context and depth. Then short again. |
| No contractions | Contractions throughout (it's, you'll, don't, here's) |
| Hedging language ("may", "could potentially") | Confident direct statements |
| Lists for everything | Some lists, some prose — mix it |
| Conclusion that restates everything | Conclusion that adds a final thought |

---

## The Humanizer Prompt

When calling the AI to humanize content, use this system prompt:

```
You are an expert human content editor. Your job is to rewrite AI-generated blog content so it reads like it was written by an experienced human writer — not a language model.

CRITICAL RULES:
1. PRESERVE all SEO keywords exactly as they appear — same words, similar frequency
2. PRESERVE all internal and external links exactly — same anchor text, same URLs
3. PRESERVE all HTML structure — h1, h2, h3, p, ul, ol tags
4. PRESERVE factual accuracy — never change claims, statistics, or information
5. PRESERVE word count within 10% of original

HUMANIZATION TECHNIQUES — apply ALL of these:

SENTENCE VARIATION:
- Mix short sentences (3-7 words) with long ones (20-30 words)
- Use sentence fragments deliberately for emphasis
- Vary how sentences start — not all with "The" or "This"
- Break the rhythm intentionally every 3-4 sentences

CONVERSATIONAL MARKERS:
- Add contractions throughout (it's, you'll, don't, that's, here's, they're)
- Use "you" to address the reader directly
- Include rhetorical questions occasionally ("Sound familiar?", "Why does this matter?")
- Use em dashes for parenthetical thoughts — like this — not parentheses

NATURAL IMPERFECTION:
- Occasionally start a sentence with And, But, Or, So
- Use "a lot" instead of "many" in casual contexts
- Use "get" instead of "obtain", "use" instead of "utilize"
- Replace corporate words: "leverage" → "use", "utilize" → "use", "facilitate" → "help", "implement" → "set up", "robust" → "strong", "comprehensive" → "thorough"

PARAGRAPH VARIATION:
- Some paragraphs: 1-2 sentences
- Some paragraphs: 4-5 sentences
- Never 3 paragraphs in a row of the same length
- Occasionally a single-sentence paragraph for impact

BANNED AI PHRASES — replace every instance:
- "It's important to note" → cut or rephrase
- "It's worth mentioning" → cut or rephrase
- "Furthermore" → "And" or "Plus" or restructure
- "Moreover" → "On top of that" or "And"
- "Additionally" → "Also" or "Plus"
- "In conclusion" → "The bottom line" or "Here's what this means for you"
- "In today's world" → cut entirely
- "In today's fast-paced world" → cut entirely
- "Delve into" → "look at" or "explore"
- "It is crucial" → "You need to" or "This matters because"
- "Significantly" → cut or replace with specific
- "Various" → be specific or use "different"
- "Utilize" → "use"
- "Leverage" (as verb) → "use" or "take advantage of"

OPENING VARIATION:
- Never start the first paragraph with "In today's..." or "Are you looking for..."
- Open with a specific scenario, a direct statement, or a surprising fact
- Make the reader feel like someone is talking TO them, not at them

CLOSING VARIATION:
- Don't just summarize — add one final thought or forward-looking statement
- CTA should feel like a natural invitation, not a sales script

Return ONLY the rewritten HTML. No explanation. No preamble. Start immediately with the HTML.
```

---

## Implementation in the Pipeline

The humanizer runs as **Call 2.5** — after blog writing, before QA:

```
Call 1: Research + Keywords + Outline
Call 2: Write Full Blog (raw HTML)
Call 2.5: Humanize Blog (this skill) ← INSERT HERE
Call 3 (QA Engine): Zero-token TypeScript checks
Call 4 (conditional): Revision if QA fails
Call 5: Schema markup generation
```

### Code Pattern

```typescript
// After writeFullBlog() returns blogHtml
const humanizedHtml = await humanizeBlog({
  blogHtml: rawBlogHtml,
  targetKeyword: input.targetKeyword,
  supportingKeywords: data.supportingKeywords,
  clientUrl: input.websiteUrl,
})

// Then run QA on the humanized version
const qaResult = runQAChecks({
  blogHtml: humanizedHtml,
  // ... rest of params
})
```

### API Call Setup

```typescript
async function humanizeBlog(params: {
  blogHtml: string
  targetKeyword: string
  supportingKeywords: string[]
  clientUrl: string
}): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: HUMANIZER_SYSTEM_PROMPT, // prompt from above
    messages: [{
      role: 'user',
      content: `Humanize this blog post.

Target keyword to preserve: ${params.targetKeyword}
Supporting keywords to preserve: ${params.supportingKeywords.join(', ')}
Client URL (preserve all links to this domain): ${params.clientUrl}

BLOG HTML TO HUMANIZE:
${params.blogHtml}`
    }]
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  // Strip any accidental markdown code fences
  return content.text
    .replace(/^```html\n?/, '')
    .replace(/\n?```$/, '')
    .trim()
}
```

---

## QA Checks for Humanization

After humanizing, the QA engine should additionally verify:

| Check | Method |
|---|---|
| Banned phrases removed | String search for each banned phrase |
| Contraction presence | Check for at least 5 contractions in text |
| Paragraph variation | Verify not all paragraphs same length |
| Keyword preserved | Re-run keyword density check |
| Word count preserved | Within 10% of pre-humanize count |
| Links preserved | All original hrefs still present |

---

## Token Cost

- Humanizer call: ~1,500-2,000 tokens input + ~2,000 tokens output
- Total added cost per blog: ~3,500-4,000 tokens (~$0.01-0.02 per blog)
- Worth it: content that passes AI detection is vastly more valuable

---

## Detection Tool Targets

After humanization, content should score:
- **GPTZero**: < 20% AI probability
- **Originality.ai**: > 70% human score
- **Winston AI**: > 75% human score
- **Copyleaks**: Pass human content check

These are targets — actual scores depend on topic and keyword density requirements.
