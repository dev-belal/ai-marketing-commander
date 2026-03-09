'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { BlogPipelineProgress } from './blog-pipeline-progress'
import { BlogOutput, type BlogOutputData } from './blog-output'
import { LoaderIcon, SparklesIcon } from 'lucide-react'
import type { QAIssue } from '@/types/seo-blog'

type Client = {
  id: string
  name: string
  website_url: string | null
}

type HistoryItem = {
  id: string
  client_id: string
  target_keyword: string
  word_count: number | null
  qa_score: number | null
  qa_passed: boolean | null
  status: string
  created_at: string
  clients: { name: string } | null
}

type SeoBlogClientProps = {
  clients: Client[]
}

type Mode = 'client' | 'standalone'

function SeoBlogClient({ clients }: SeoBlogClientProps) {
  const [mode, setMode] = useState<Mode>('client')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [isStarting, setIsStarting] = useState(false)

  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [outputData, setOutputData] = useState<BlogOutputData | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Auto-fill website URL when client changes
  useEffect(() => {
    if (mode === 'client' && selectedClientId) {
      const client = clients.find((c) => c.id === selectedClientId)
      if (client?.website_url) {
        setWebsiteUrl(client.website_url)
      }
      fetchHistory(selectedClientId)
    } else if (mode === 'standalone') {
      fetchHistory(null)
    } else {
      setHistory([])
    }
  }, [selectedClientId, clients, mode])

  async function fetchHistory(clientId: string | null) {
    try {
      const url = clientId
        ? `/api/seo-blog/history?clientId=${clientId}`
        : '/api/seo-blog/history'
      const res = await fetch(url)
      const json = await res.json()
      if (json.success) {
        setHistory(json.data)
      }
    } catch {
      // silently fail
    }
  }

  async function handleStart() {
    if (mode === 'client' && !selectedClientId) {
      toast.error('Please select a client')
      return
    }
    if (!websiteUrl.trim() || !targetKeyword.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsStarting(true)
    setOutputData(null)

    try {
      const res = await fetch('/api/seo-blog/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: mode === 'client' ? selectedClientId : null,
          websiteUrl: websiteUrl.trim(),
          targetKeyword: targetKeyword.trim(),
        }),
      })

      const json = await res.json()

      if (!json.success) {
        toast.error(json.error ?? 'Failed to start')
        return
      }

      setActiveRunId(json.data.runId)
    } catch {
      toast.error('Network error')
    } finally {
      setIsStarting(false)
    }
  }

  const handlePipelineComplete = useCallback(async () => {
    if (!activeRunId) return

    try {
      const res = await fetch(`/api/seo-blog/status/${activeRunId}`)
      const json = await res.json()

      if (json.success) {
        const run = json.data
        setOutputData({
          blogHtml: run.blog_html ?? '',
          wordCount: run.word_count ?? 0,
          qaScore: run.qa_score ?? 0,
          qaPassed: run.qa_passed ?? false,
          qaIssues: (run.qa_issues as QAIssue[]) ?? [],
          titleTag: run.title_tag ?? '',
          metaDescription: run.meta_description ?? '',
          slug: run.slug ?? '',
          schemaMarkup: run.schema_markup ?? '',
          revisionApplied: run.revision_applied ?? false,
          targetKeyword: run.target_keyword,
          supportingKeywords: run.supporting_keywords ?? [],
        })
        setActiveRunId(null)

        // Refresh history
        if (mode === 'client' && selectedClientId) {
          fetchHistory(selectedClientId)
        } else if (mode === 'standalone') {
          fetchHistory(null)
        }
      }
    } catch {
      // handled by progress component
    }
  }, [activeRunId, selectedClientId, mode])

  async function handleLoadRun(runId: string) {
    try {
      const res = await fetch(`/api/seo-blog/status/${runId}`)
      const json = await res.json()

      if (json.success) {
        const run = json.data

        if (run.status !== 'complete') {
          setActiveRunId(runId)
          setOutputData(null)
          return
        }

        setOutputData({
          blogHtml: run.blog_html ?? '',
          wordCount: run.word_count ?? 0,
          qaScore: run.qa_score ?? 0,
          qaPassed: run.qa_passed ?? false,
          qaIssues: (run.qa_issues as QAIssue[]) ?? [],
          titleTag: run.title_tag ?? '',
          metaDescription: run.meta_description ?? '',
          slug: run.slug ?? '',
          schemaMarkup: run.schema_markup ?? '',
          revisionApplied: run.revision_applied ?? false,
          targetKeyword: run.target_keyword,
          supportingKeywords: run.supporting_keywords ?? [],
        })
        setActiveRunId(null)
      }
    } catch {
      toast.error('Failed to load run')
    }
  }

  function handleRegenerate() {
    setOutputData(null)
    handleStart()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* LEFT COLUMN */}
      <div className="space-y-6">
        {/* Input form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SparklesIcon className="size-4 text-primary" />
              Generate SEO Blog
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode toggle */}
            <div className="flex rounded-full border p-0.5">
              <button
                type="button"
                onClick={() => setMode('client')}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'client'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                For a Client
              </button>
              <button
                type="button"
                onClick={() => setMode('standalone')}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'standalone'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Standalone
              </button>
            </div>

            {mode === 'client' && (
              <div className="space-y-2">
                <Label htmlFor="blog-client">Client</Label>
                <select
                  id="blog-client"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="blog-url">Website URL</Label>
              <Input
                id="blog-url"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-keyword">Target Keyword</Label>
              <Input
                id="blog-keyword"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="e.g. best seo tools for agencies"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleStart}
              disabled={isStarting || !!activeRunId || (mode === 'client' && !selectedClientId)}
            >
              {isStarting ? (
                <>
                  <LoaderIcon className="size-4 animate-spin" />
                  Starting...
                </>
              ) : activeRunId ? (
                'Pipeline Running...'
              ) : (
                'Generate Blog'
              )}
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              Estimated time: ~45-90 seconds
            </p>
          </CardContent>
        </Card>

        {/* Recent blogs */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Blogs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.slice(0, 5).map((item) => {
                  const date = new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })

                  const scoreColor =
                    (item.qa_score ?? 0) >= 80 ? 'default' as const :
                    (item.qa_score ?? 0) >= 70 ? 'secondary' as const :
                    'destructive' as const

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleLoadRun(item.id)}
                      className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <p className="truncate text-sm font-medium">
                            {item.target_keyword}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.clients?.name ?? 'Standalone'}
                            {' · '}
                            {date}
                            {item.word_count ? ` · ${item.word_count} words` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {item.qa_score !== null && (
                            <Badge variant={scoreColor} className="text-[10px]">
                              {item.qa_score}
                            </Badge>
                          )}
                          <Badge
                            variant={item.status === 'complete' ? 'default' : item.status === 'failed' ? 'destructive' : 'secondary'}
                            className="text-[10px]"
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div>
        {!activeRunId && !outputData && (
          <Card>
            <CardContent className="flex min-h-[400px] items-center justify-center py-12">
              <div className="text-center space-y-2">
                <SparklesIcon className="mx-auto size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Select a client and enter a keyword to generate an SEO blog post.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeRunId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline Running</CardTitle>
            </CardHeader>
            <CardContent>
              <BlogPipelineProgress
                runId={activeRunId}
                onComplete={handlePipelineComplete}
              />
            </CardContent>
          </Card>
        )}

        {outputData && (
          <BlogOutput data={outputData} onRegenerate={handleRegenerate} />
        )}
      </div>
    </div>
  )
}

export { SeoBlogClient }
