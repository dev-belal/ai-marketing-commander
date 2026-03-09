export type AuditDimension = 'seo' | 'content' | 'technical'

export type AuditType = 'full' | 'seo' | 'content' | 'technical'

export type AuditStatus = 'pending' | 'running' | 'completed' | 'failed'

export type AuditAgentResult = {
  dimension: AuditDimension
  score: number
  findings: string[]
  recommendations: string[]
  tokensUsed: number
  rawOutput: string
}

export type BrandContext = {
  voice: string | null
  icp: string | null
  services: unknown[]
  competitors: unknown[]
  keywords: unknown[]
  goals: string | null
  additional_context: string | null
}
