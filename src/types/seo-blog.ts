export interface SeoBlogInput {
  clientId: string | null
  websiteUrl: string
  targetKeyword: string
}

export interface QAIssue {
  code: string
  severity: 'critical' | 'warning' | 'info'
  detail: string
}

export interface QAResult {
  passed: boolean
  score: number
  issues: QAIssue[]
  wordCount: number
  keywordCount: number
  h1Count: number
  h2Count: number
  internalLinkCount: number
}

export interface BlogPipelineState {
  runId: string
  status: string
  supportingKeywords: string[]
  blogTitle: string
  contentOutline: string
  blogHtml: string
  wordCount: number
  titleTag: string
  metaDescription: string
  slug: string
  schemaMarkup: string
  qaResult: QAResult | null
  revisionApplied: boolean
}

export interface BlogProgressStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  detail?: string
}
