'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  CheckCircle2Icon,
  ClipboardIcon,
  DownloadIcon,
  XCircleIcon,
  AlertTriangleIcon,
} from 'lucide-react'
import type { QAIssue } from '@/types/seo-blog'

type BlogOutputData = {
  blogHtml: string
  wordCount: number
  qaScore: number
  qaPassed: boolean
  qaIssues: QAIssue[]
  titleTag: string
  metaDescription: string
  slug: string
  schemaMarkup: string
  revisionApplied: boolean
  targetKeyword: string
  supportingKeywords: string[]
}

type BlogOutputProps = {
  data: BlogOutputData
  onRegenerate: () => void
}

const TABS = ['Preview', 'HTML', 'Metadata', 'Schema', 'QA Report'] as const
type Tab = (typeof TABS)[number]

function BlogOutput({ data, onRegenerate }: BlogOutputProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Preview')

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  function downloadHtml() {
    const blob = new Blob([data.blogHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.slug || 'blog-post'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const qaColor =
    data.qaScore >= 80 ? 'text-green-600 bg-green-50 border-green-200' :
    data.qaScore >= 70 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
    'text-red-600 bg-red-50 border-red-200'

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{data.wordCount.toLocaleString()} words</Badge>
        <Badge variant="secondary" className={qaColor}>
          QA: {data.qaScore}/100
        </Badge>
        <Badge variant="secondary">
          Keyword: {data.targetKeyword}
        </Badge>
        {data.revisionApplied && (
          <Badge variant="secondary" className="text-blue-600 bg-blue-50 border-blue-200">
            Revision Applied
          </Badge>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => copyToClipboard(data.blogHtml, 'HTML')}>
          <ClipboardIcon className="size-3.5" />
          Copy HTML
        </Button>
        <Button size="sm" variant="outline" onClick={downloadHtml}>
          <DownloadIcon className="size-3.5" />
          Download .html
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            copyToClipboard(
              `Title Tag: ${data.titleTag}\nMeta Description: ${data.metaDescription}\nSlug: ${data.slug}`,
              'Metadata'
            )
          }
        >
          <ClipboardIcon className="size-3.5" />
          Copy Metadata
        </Button>
        <Button size="sm" variant="outline" onClick={onRegenerate}>
          Regenerate
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Preview' && (
        <Card>
          <CardContent className="pt-6">
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: data.blogHtml }}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'HTML' && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Raw HTML</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(data.blogHtml, 'HTML')}
              >
                <ClipboardIcon className="size-3.5" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-300">
              <code>{data.blogHtml}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      {activeTab === 'Metadata' && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <MetaField label="Title Tag" value={data.titleTag} charCount={data.titleTag.length} target="50-60" onCopy={copyToClipboard} />
            <MetaField label="Meta Description" value={data.metaDescription} charCount={data.metaDescription.length} target="150-160" onCopy={copyToClipboard} />
            <MetaField label="Slug" value={data.slug} onCopy={copyToClipboard} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'Schema' && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">JSON-LD Schema</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(data.schemaMarkup, 'Schema')}
              >
                <ClipboardIcon className="size-3.5" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-300">
              <code>{data.schemaMarkup}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      {activeTab === 'QA Report' && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2">
              {data.qaPassed ? (
                <CheckCircle2Icon className="size-5 text-green-500" />
              ) : (
                <XCircleIcon className="size-5 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {data.qaPassed ? 'QA Passed' : 'QA Failed'} — Score: {data.qaScore}/100
              </span>
            </div>

            {data.qaIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">All checks passed.</p>
            ) : (
              <div className="space-y-2">
                {data.qaIssues.map((issue, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                      issue.severity === 'critical'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    {issue.severity === 'critical' ? (
                      <XCircleIcon className="mt-0.5 size-3.5 shrink-0" />
                    ) : (
                      <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
                    )}
                    <div>
                      <span className="font-mono text-xs">{issue.code}</span>
                      <span className="mx-1.5">—</span>
                      <span>{issue.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MetaField({
  label,
  value,
  charCount,
  target,
  onCopy,
}: {
  label: string
  value: string
  charCount?: number
  target?: string
  onCopy: (text: string, label: string) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          {label}
          {charCount !== undefined && target && (
            <span className="ml-1 text-[10px]">
              ({charCount} chars — target: {target})
            </span>
          )}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
          onClick={() => onCopy(value, label)}
        >
          <ClipboardIcon className="size-3" />
        </Button>
      </div>
      <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono">
        {value}
      </div>
    </div>
  )
}

export { BlogOutput }
export type { BlogOutputData }
