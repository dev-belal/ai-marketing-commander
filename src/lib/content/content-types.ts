import type { ContentTypeConfig } from '@/types/content'

export const CONTENT_TYPES: ContentTypeConfig[] = [
  // ═══════════════════════════════════════
  // SEO
  // ═══════════════════════════════════════
  {
    id: 'service_page',
    label: 'Service Page',
    description: 'Full service page copy with hero, benefits, CTA',
    category: 'seo',
    icon: 'FileText',
    estimatedTime: '~15 seconds',
    inputs: [
      { id: 'service_name', label: 'Service Name', type: 'text', required: true },
      { id: 'location', label: 'Location', type: 'text', required: false, placeholder: 'City, State' },
      { id: 'unique_angle', label: 'Unique Angle', type: 'textarea', required: false, placeholder: 'What makes this service different?' },
      { id: 'target_audience', label: 'Target Audience', type: 'text', required: false },
    ],
  },
  {
    id: 'location_page',
    label: 'Location Landing Page',
    description: 'Locally optimized page for a city/region',
    category: 'seo',
    icon: 'MapPin',
    estimatedTime: '~15 seconds',
    inputs: [
      { id: 'city', label: 'City', type: 'text', required: true },
      { id: 'state', label: 'State', type: 'text', required: true },
      { id: 'service', label: 'Service', type: 'text', required: true },
      { id: 'local_angle', label: 'Local Angle', type: 'textarea', required: false, placeholder: 'Any local details, landmarks, or context?' },
    ],
  },
  {
    id: 'faq_page',
    label: 'FAQ Page',
    description: 'Schema-ready FAQ with natural language questions',
    category: 'seo',
    icon: 'HelpCircle',
    estimatedTime: '~10 seconds',
    inputs: [
      { id: 'topic', label: 'Topic', type: 'text', required: true },
      { id: 'num_questions', label: 'Number of Questions', type: 'select', required: true, options: ['5', '8', '10', '15'] },
      { id: 'audience', label: 'Audience', type: 'text', required: false },
    ],
  },
  {
    id: 'meta_tags',
    label: 'Meta Tags (Bulk)',
    description: 'Title tags + meta descriptions for multiple pages',
    category: 'seo',
    icon: 'Tag',
    estimatedTime: '~10 seconds',
    inputs: [
      { id: 'pages', label: 'Pages', type: 'textarea', required: true, placeholder: 'List page names or URLs, one per line' },
      { id: 'primary_keyword', label: 'Primary Keyword', type: 'text', required: true },
      { id: 'page_type', label: 'Page Type', type: 'select', required: true, options: ['homepage', 'service', 'blog', 'location', 'about'] },
    ],
  },
  {
    id: 'content_brief',
    label: 'Content Brief',
    description: 'Full SEO content brief for a writer or AI',
    category: 'seo',
    icon: 'ClipboardList',
    estimatedTime: '~10 seconds',
    inputs: [
      { id: 'topic', label: 'Topic', type: 'text', required: true },
      { id: 'target_keyword', label: 'Target Keyword', type: 'text', required: true },
      { id: 'content_goal', label: 'Content Goal', type: 'select', required: true, options: ['inform', 'convert', 'rank', 'engage'] },
    ],
  },

  // ═══════════════════════════════════════
  // ADS
  // ═══════════════════════════════════════
  {
    id: 'google_search_ads',
    label: 'Google Search Ads',
    description: '15 headlines + 4 descriptions, Google Ads ready',
    category: 'ads',
    icon: 'Search',
    estimatedTime: '~10 seconds',
    inputs: [
      { id: 'service', label: 'Service', type: 'text', required: true },
      { id: 'location', label: 'Location', type: 'text', required: false },
      { id: 'offer', label: 'Offer / USP', type: 'textarea', required: false, placeholder: 'Special offer or USP' },
      { id: 'num_variants', label: 'Number of Variants', type: 'select', required: true, options: ['3', '5', '10'] },
    ],
  },
  {
    id: 'meta_ad_copy',
    label: 'Meta Ad Copy',
    description: 'Facebook/Instagram ad copy with 3 variants',
    category: 'ads',
    icon: 'Instagram',
    estimatedTime: '~10 seconds',
    inputs: [
      { id: 'offer', label: 'Offer', type: 'textarea', required: true },
      { id: 'audience', label: 'Target Audience', type: 'text', required: true, placeholder: 'Who is this ad targeting?' },
      { id: 'objective', label: 'Objective', type: 'select', required: true, options: ['awareness', 'leads', 'conversions', 'traffic'] },
      { id: 'tone', label: 'Tone', type: 'select', required: true, options: ['professional', 'conversational', 'urgent', 'inspiring'] },
    ],
  },
  {
    id: 'ab_ad_variants',
    label: 'A/B Ad Variants',
    description: 'Multiple variants testing different angles',
    category: 'ads',
    icon: 'GitBranch',
    estimatedTime: '~10 seconds',
    inputs: [
      { id: 'base_concept', label: 'Base Concept', type: 'textarea', required: true, placeholder: 'Describe the ad concept or paste existing copy' },
      { id: 'num_variants', label: 'Number of Variants', type: 'select', required: true, options: ['3', '5'] },
      { id: 'element_to_test', label: 'Element to Test', type: 'select', required: true, options: ['headline', 'CTA', 'body', 'value_proposition'] },
    ],
  },
  {
    id: 'retargeting_ad',
    label: 'Retargeting Ad',
    description: 'Re-engage warm audiences who didn\'t convert',
    category: 'ads',
    icon: 'RefreshCw',
    estimatedTime: '~10 seconds',
    inputs: [
      { id: 'product_service', label: 'Product / Service', type: 'text', required: true },
      { id: 'objection', label: 'Main Objection', type: 'textarea', required: false, placeholder: 'Main reason they didn\'t convert?' },
      { id: 'offer', label: 'Offer', type: 'text', required: false, placeholder: 'Incentive to bring them back' },
    ],
  },
  {
    id: 'ad_creative',
    label: 'Ad Creative + Brief',
    description: 'AI-generated image + Canva design brief',
    category: 'ads',
    icon: 'Image',
    estimatedTime: '~30 seconds',
    hasImageGeneration: true,
    inputs: [
      { id: 'ad_concept', label: 'Ad Concept', type: 'textarea', required: true, placeholder: 'Describe what the ad should show' },
      { id: 'format', label: 'Format', type: 'select', required: true, options: ['square_1080x1080', 'story_1080x1920', 'banner_1200x628', 'reel_cover_1080x1080'] },
      { id: 'style', label: 'Style', type: 'select', required: true, options: ['professional', 'bold', 'minimal', 'lifestyle', 'product_focused'] },
      { id: 'color_override', label: 'Color Override', type: 'text', required: false, placeholder: 'Brand color hex e.g. #2563EB' },
    ],
  },

  // ═══════════════════════════════════════
  // EMAIL
  // ═══════════════════════════════════════
  {
    id: 'cold_outreach',
    label: 'Cold Outreach Email',
    description: 'Personalized cold email that gets replies',
    category: 'email',
    icon: 'Mail',
    estimatedTime: '~10 seconds',
    inputs: [
      { id: 'prospect_role', label: 'Prospect Role', type: 'text', required: true, placeholder: 'e.g. Marketing Director, Practice Owner' },
      { id: 'pain_point', label: 'Pain Point', type: 'textarea', required: true, placeholder: 'What problem does this prospect have?' },
      { id: 'offer', label: 'Offer', type: 'text', required: true, placeholder: 'What are you offering?' },
      { id: 'tone', label: 'Tone', type: 'select', required: true, options: ['professional', 'casual', 'direct', 'consultative'] },
    ],
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Engaging newsletter with story, value, CTA',
    category: 'email',
    icon: 'Newspaper',
    estimatedTime: '~15 seconds',
    inputs: [
      { id: 'topic', label: 'Topic', type: 'text', required: true },
      { id: 'main_story', label: 'Main Story', type: 'textarea', required: true, placeholder: 'Main story or insight to share' },
      { id: 'cta', label: 'Call to Action', type: 'text', required: true, placeholder: 'What do you want readers to do?' },
      { id: 'tone', label: 'Tone', type: 'select', required: true, options: ['professional', 'conversational', 'inspiring'] },
    ],
  },
  {
    id: 'follow_up_sequence',
    label: 'Follow-Up Sequence',
    description: 'Multi-email nurture sequence',
    category: 'email',
    icon: 'MailCheck',
    estimatedTime: '~20 seconds',
    inputs: [
      { id: 'sequence_goal', label: 'Sequence Goal', type: 'text', required: true, placeholder: 'e.g. Book a call, Close a sale, Onboard' },
      { id: 'num_emails', label: 'Number of Emails', type: 'select', required: true, options: ['3', '5', '7'] },
      { id: 'days_between', label: 'Days Between', type: 'select', required: true, options: ['1', '2', '3', '5', '7'] },
      { id: 'starting_context', label: 'Starting Context', type: 'textarea', required: false, placeholder: 'What happened before this sequence starts?' },
    ],
  },
  {
    id: 'reengagement_email',
    label: 'Re-Engagement Email',
    description: 'Win back cold or inactive contacts',
    category: 'email',
    icon: 'MailOpen',
    estimatedTime: '~10 seconds',
    inputs: [
      { id: 'reason_went_cold', label: 'Reason They Went Cold', type: 'text', required: false, placeholder: 'Why did they go quiet?' },
      { id: 'new_offer', label: 'New Offer', type: 'textarea', required: true, placeholder: 'New offer, update, or reason to reconnect' },
      { id: 'urgency', label: 'Urgency', type: 'select', required: true, options: ['low', 'medium', 'high'] },
    ],
  },

  // ═══════════════════════════════════════
  // SOCIAL
  // ═══════════════════════════════════════
  {
    id: 'linkedin_post',
    label: 'LinkedIn Post',
    description: 'Thought leadership or lead gen post',
    category: 'social',
    icon: 'Linkedin',
    estimatedTime: '~10 seconds',
    inputs: [
      { id: 'topic', label: 'Topic', type: 'text', required: true },
      { id: 'goal', label: 'Goal', type: 'select', required: true, options: ['thought_leadership', 'lead_gen', 'engagement', 'announcement', 'case_study'] },
      { id: 'format', label: 'Format', type: 'select', required: true, options: ['story', 'list', 'insight', 'question', 'poll'] },
    ],
  },
  {
    id: 'twitter_thread',
    label: 'Twitter/X Thread',
    description: 'Engaging thread with hook + value + CTA',
    category: 'social',
    icon: 'Twitter',
    estimatedTime: '~10 seconds',
    inputs: [
      { id: 'topic', label: 'Topic', type: 'text', required: true },
      { id: 'num_tweets', label: 'Number of Tweets', type: 'select', required: true, options: ['5', '7', '10', '12'] },
      { id: 'hook_angle', label: 'Hook Angle', type: 'text', required: false, placeholder: 'Angle for the opening tweet' },
      { id: 'goal', label: 'Goal', type: 'select', required: true, options: ['educate', 'build_authority', 'drive_follows', 'promote_offer'] },
    ],
  },
  {
    id: 'instagram_caption',
    label: 'Instagram Caption',
    description: 'Caption with hooks, value, hashtags',
    category: 'social',
    icon: 'Camera',
    estimatedTime: '~10 seconds',
    inputs: [
      { id: 'post_topic', label: 'Post Topic', type: 'text', required: true },
      { id: 'post_type', label: 'Post Type', type: 'select', required: true, options: ['educational', 'promotional', 'storytelling', 'engagement', 'behind_scenes'] },
      { id: 'include_hashtags', label: 'Include Hashtags', type: 'select', required: true, options: ['yes', 'no'] },
      { id: 'tone', label: 'Tone', type: 'select', required: true, options: ['professional', 'casual', 'inspiring', 'witty'] },
    ],
  },
  {
    id: 'google_business_post',
    label: 'Google Business Post',
    description: 'GBP post for local SEO and visibility',
    category: 'social',
    icon: 'MapPin',
    estimatedTime: '~8 seconds',
    inputs: [
      { id: 'post_type', label: 'Post Type', type: 'select', required: true, options: ['whats_new', 'offer', 'event', 'product'] },
      { id: 'topic', label: 'Topic', type: 'text', required: true },
      { id: 'cta', label: 'CTA Button', type: 'select', required: true, options: ['call', 'book', 'learn_more', 'visit', 'sign_up', 'order_online'] },
      { id: 'offer_details', label: 'Offer Details', type: 'text', required: false },
    ],
  },
]

export function getContentTypesByCategory(category: string): ContentTypeConfig[] {
  return CONTENT_TYPES.filter((t) => t.category === category)
}

export function getContentTypeConfig(id: string): ContentTypeConfig | undefined {
  return CONTENT_TYPES.find((t) => t.id === id)
}
