import type { ContentType } from '@/types/content'
import type { BrandContext } from '@/types/audit'

function buildBrandBlock(clientName: string, brand: BrandContext): string {
  const voice = brand.voice ?? 'professional and authoritative'
  const icp = brand.icp ?? 'business professionals'
  const services = Array.isArray(brand.services) && brand.services.length > 0
    ? (brand.services as string[]).join(', ')
    : 'various professional services'
  const keywords = Array.isArray(brand.keywords) && brand.keywords.length > 0
    ? (brand.keywords as string[]).join(', ')
    : 'not specified'
  const competitors = Array.isArray(brand.competitors) && brand.competitors.length > 0
    ? (brand.competitors as string[]).join(', ')
    : 'not specified'
  const goals = brand.goals ?? 'grow the business'

  return `You are writing for ${clientName}.
Brand voice: ${voice}
Target audience: ${icp}
Services offered: ${services}
Primary keywords: ${keywords}
Competitors: ${competitors}
Business goals: ${goals}

Write in this brand voice throughout. Never sound generic.`
}

const PROMPT_SUFFIX = '\n\nReturn only the content. No preamble, no explanation, no meta-commentary. Start with the output immediately.'

type Inputs = Record<string, string>

const promptBuilders: Record<ContentType, (inputs: Inputs) => string> = {
  service_page: (inputs) =>
    `Write a complete service page in HTML for "${inputs.service_name}".
${inputs.location ? `Location: ${inputs.location}` : ''}
${inputs.unique_angle ? `Unique angle: ${inputs.unique_angle}` : ''}
${inputs.target_audience ? `Target audience: ${inputs.target_audience}` : ''}

Structure: <h1> hero headline (contains service name), <p> subheadline, 3x <h2> benefit sections each with <p>, <h2> How It Works with 3 steps, <h2> CTA section with compelling offer. 600-800 words. Brand voice throughout.${PROMPT_SUFFIX}`,

  location_page: (inputs) =>
    `Write a locally optimized landing page in HTML.
Target location: ${inputs.city}, ${inputs.state}.
Service: ${inputs.service}.
${inputs.local_angle ? `Local context: ${inputs.local_angle}` : ''}

H1 must contain service + city. Include city name naturally 8-10 times. Mention local context where relevant. Include NAP placeholder block at bottom. Structure same as service page. 500-700 words.${PROMPT_SUFFIX}`,

  faq_page: (inputs) =>
    `Write ${inputs.num_questions} FAQs about "${inputs.topic}" in HTML.
${inputs.audience ? `Audience: ${inputs.audience}` : ''}

Use <div class='faq-item'><h3 class='faq-question'>Question</h3><div class='faq-answer'><p>Answer</p></div></div> format for each. Questions must be natural language (how people actually search). Answers 50-100 words each. Include target keyword naturally. Schema-ready structure.${PROMPT_SUFFIX}`,

  meta_tags: (inputs) =>
    `Generate SEO meta tags for these pages:
${inputs.pages}

Primary keyword: ${inputs.primary_keyword}
Page type: ${inputs.page_type}

For each page return:
PAGE: [page name]
TITLE: [50-60 chars exactly, contains keyword]
META: [150-160 chars exactly, compelling, contains keyword]
SLUG: [lowercase-hyphenated, 3-5 words]
---
Be precise with character counts. Count carefully.${PROMPT_SUFFIX}`,

  content_brief: (inputs) =>
    `Create a comprehensive SEO content brief.
Topic: ${inputs.topic}
Target keyword: ${inputs.target_keyword}
Content goal: ${inputs.content_goal}

Return in this structure:
# Content Brief: ${inputs.topic}
## Target Keyword
## Search Intent
## Target Audience
## Recommended Title (3 options)
## Meta Description (2 options)
## Recommended Word Count
## Content Outline (H2s and H3s)
## Keywords to Include (primary + 6-8 secondary)
## Internal Link Opportunities
## External Link Suggestions
## Competitor Content to Beat
## Success Metrics${PROMPT_SUFFIX}`,

  google_search_ads: (inputs) =>
    `Generate Google Search Ads for "${inputs.service}".
${inputs.location ? `Location: ${inputs.location}` : ''}
${inputs.offer ? `Offer/USP: ${inputs.offer}` : ''}
Number of ad variants: ${inputs.num_variants}

Return in this exact format:
## HEADLINES (30 chars max each)
1. [headline]
... (15 total)

## DESCRIPTIONS (90 chars max each)
1. [description]
... (4 total)

Count every character. Hard limits — Google will reject anything over limit.${PROMPT_SUFFIX}`,

  meta_ad_copy: (inputs) =>
    `Generate 3 Facebook/Instagram ad variants.
Offer: ${inputs.offer}
Audience: ${inputs.audience}
Objective: ${inputs.objective}
Tone: ${inputs.tone}

For each variant return:
VARIANT [N]:
PRIMARY TEXT: (125 chars max — count carefully)
HEADLINE: (40 chars max)
DESCRIPTION: (30 chars max)
---${PROMPT_SUFFIX}`,

  ab_ad_variants: (inputs) =>
    `Generate ${inputs.num_variants} A/B test variants for this ad.
Base concept: ${inputs.base_concept}
Focus on testing: ${inputs.element_to_test}

Keep everything else identical between variants.
For each variant:
VARIANT [N] — [what's different]:
[full copy]
---
End with: HYPOTHESIS: Why variant B might outperform A.${PROMPT_SUFFIX}`,

  retargeting_ad: (inputs) =>
    `Write retargeting ad copy for warm audiences.
Product/Service: ${inputs.product_service}
${inputs.objection ? `Main objection: ${inputs.objection}` : ''}
${inputs.offer ? `Incentive: ${inputs.offer}` : ''}

These people have seen the brand but didn't convert.
Acknowledge they've heard of us (subtly).
Address the objection if provided.
Create urgency or value.
Return 3 versions: short (50 words), medium (100 words), long (150 words).${PROMPT_SUFFIX}`,

  ad_creative: (inputs) =>
    `Write a Canva-compatible design brief for this ad creative.
Ad concept: ${inputs.ad_concept}
Format: ${inputs.format}
Style: ${inputs.style}
${inputs.color_override ? `Brand color: ${inputs.color_override}` : ''}

Return:
DESIGN BRIEF: ${inputs.ad_concept}
FORMAT: ${inputs.format}
STYLE DIRECTION: ${inputs.style}

VISUAL CONCEPT:
[2-3 sentences describing the visual]

COLOR PALETTE:
Primary: [brand color]
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
CTA: [call to action text]${PROMPT_SUFFIX}`,

  cold_outreach: (inputs) =>
    `Write a cold outreach email.
Prospect role: ${inputs.prospect_role}
Pain point: ${inputs.pain_point}
Offer: ${inputs.offer}
Tone: ${inputs.tone}

Subject line: under 50 chars, curiosity-driven.
Body: 4 short paragraphs max.
P1: Personalized opener (reference their role/industry)
P2: Pain point identification
P3: How we solve it (1-2 sentences)
P4: Soft CTA (low friction ask)
PS line: add credibility or urgency.
No buzzwords. Sound human. Under 150 words body.${PROMPT_SUFFIX}`,

  newsletter: (inputs) =>
    `Write a newsletter email.
Topic: ${inputs.topic}
Main story: ${inputs.main_story}
CTA: ${inputs.cta}
Tone: ${inputs.tone}

Subject line: engaging, under 60 chars.
Preview text: 90 chars.
Structure:
- Opening hook (1-2 sentences)
- Main story/insight (3-4 paragraphs)
- Key takeaway (bulleted)
- CTA section
- Sign-off
Conversational tone. 300-400 words body.${PROMPT_SUFFIX}`,

  follow_up_sequence: (inputs) =>
    `Write a ${inputs.num_emails}-email follow-up sequence.
Goal: ${inputs.sequence_goal}
${inputs.days_between} days between emails.
${inputs.starting_context ? `Context: ${inputs.starting_context}` : ''}

For each email:
EMAIL [N] — Day [X]:
Subject: [subject line]
Preview: [preview text]
Body: [email body]
---
Emails should escalate: value → social proof → urgency → final ask.
Each under 150 words.${PROMPT_SUFFIX}`,

  reengagement_email: (inputs) =>
    `Write a re-engagement email for cold contacts.
${inputs.reason_went_cold ? `Reason they went cold: ${inputs.reason_went_cold}` : ''}
New offer/value: ${inputs.new_offer}
Urgency level: ${inputs.urgency}

Subject line: pattern interrupt — surprising, not salesy.
Body: Acknowledge the silence (briefly, not awkwardly).
Lead with new value or update.
Make it easy to respond with one line.
Under 120 words. Human tone.${PROMPT_SUFFIX}`,

  linkedin_post: (inputs) =>
    `Write a LinkedIn post.
Topic: ${inputs.topic}
Goal: ${inputs.goal}
Format: ${inputs.format}

Hook (first line): must stop the scroll — bold statement, surprising stat, or provocative question.
Body: value, story, or insight.
End: engagement question or soft CTA.
No hashtag spam — max 3 relevant hashtags at end.
200-400 words. Line breaks every 1-2 sentences.${PROMPT_SUFFIX}`,

  twitter_thread: (inputs) =>
    `Write a Twitter/X thread.
Topic: ${inputs.topic}
${inputs.num_tweets} tweets. Each under 280 characters.
${inputs.hook_angle ? `Hook angle: ${inputs.hook_angle}` : ''}
Goal: ${inputs.goal}

Tweet 1: Hook — must make people want to read more.
Tweets 2-${Number(inputs.num_tweets) - 1}: Value, insights, steps.
Tweet ${inputs.num_tweets}: CTA + follow request.
Number each: 1/ 2/ 3/ etc.
No filler tweets. Every tweet must standalone as insight.${PROMPT_SUFFIX}`,

  instagram_caption: (inputs) =>
    `Write an Instagram caption.
Topic: ${inputs.post_topic}
Type: ${inputs.post_type}
Tone: ${inputs.tone}

Hook: First line must work without the 'more' cutoff.
Body: 3-5 short paragraphs with line breaks.
CTA: clear action at the end.
${inputs.include_hashtags === 'yes' ? 'Add 15-20 relevant hashtags at end after line break.' : 'No hashtags.'}
150-300 words caption body.${PROMPT_SUFFIX}`,

  google_business_post: (inputs) =>
    `Write a Google Business Profile post.
Type: ${inputs.post_type}
Topic: ${inputs.topic}
CTA button type: ${inputs.cta}
${inputs.offer_details ? `Offer details: ${inputs.offer_details}` : ''}

150-300 words max (GBP limit).
Include: what, why it matters, CTA.
Local focus — mention the city/area.
No fluff. Direct and action-oriented.${PROMPT_SUFFIX}`,
}

export function buildPrompt(
  contentType: ContentType,
  clientName: string,
  brandContext: BrandContext,
  inputs: Record<string, string>
): string {
  const brandBlock = buildBrandBlock(clientName, brandContext)
  const typePrompt = promptBuilders[contentType](inputs)
  return `${brandBlock}\n\n${typePrompt}`
}
