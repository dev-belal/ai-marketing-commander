export interface BlogAuditInput {
  pageUrl: string
  targetKeyword: string
  clientId?: string | null
}

export interface AuditCheck {
  code: string
  label: string
  status: 'pass' | 'fail' | 'warning'
  severity: 'critical' | 'warning' | 'info'
  detail: string
  howToFix?: string
}

export interface AuditCategory {
  id: string
  label: string
  score: number
  maxScore: number
  checks: AuditCheck[]
}

export interface BlogAuditResult {
  runId: string
  pageUrl: string
  targetKeyword: string
  overallScore: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  categories: AuditCategory[]
  priorityFixes: AuditCheck[]
  recommendations: string
  stats: {
    wordCount: number
    keywordCount: number
    keywordDensity: string
    h1Count: number
    h2Count: number
    h3Count: number
    internalLinks: number
    externalLinks: number
    images: number
    imagesMissingAlt: number
    hasSchema: boolean
    schemaType: string | null
    hasCanonical: boolean
  }
}
