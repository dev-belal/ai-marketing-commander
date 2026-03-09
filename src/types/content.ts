export type ContentCategory = 'seo' | 'ads' | 'email' | 'social'

export type ContentType =
  // SEO
  | 'service_page'
  | 'location_page'
  | 'faq_page'
  | 'meta_tags'
  | 'content_brief'
  // ADS
  | 'google_search_ads'
  | 'meta_ad_copy'
  | 'ab_ad_variants'
  | 'retargeting_ad'
  | 'ad_creative'
  // EMAIL
  | 'cold_outreach'
  | 'newsletter'
  | 'follow_up_sequence'
  | 'reengagement_email'
  // SOCIAL
  | 'linkedin_post'
  | 'twitter_thread'
  | 'instagram_caption'
  | 'google_business_post'

export interface ContentTypeConfig {
  id: ContentType
  label: string
  description: string
  category: ContentCategory
  icon: string
  estimatedTime: string
  inputs: ContentInput[]
  hasImageGeneration?: boolean
}

export interface ContentInput {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  placeholder?: string
  required: boolean
  options?: string[]
}

export interface GeneratedContent {
  id: string
  contentType: ContentType
  category: ContentCategory
  output: string
  wordCount: number
  createdAt: string
  inputParams: Record<string, string>
  creativeImageUrl?: string
  creativeDesignBrief?: string
}

export interface AdCreativeResult {
  imageUrl: string
  designBrief: string
  storagePath: string
}
