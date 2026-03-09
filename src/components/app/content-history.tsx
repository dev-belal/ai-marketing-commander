'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  CopyIcon,
  Trash2Icon,
  EyeIcon,
  XIcon,
  LoaderIcon,
  HistoryIcon,
  ImageIcon,
} from 'lucide-react'
import type { ContentCategory } from '@/types/content'

type Client = {
  id: string
  name: string
  website_url: string | null
}

type HistoryRow = {
  id: string
  client_id: string | null
  content_category: string
  content_type: string
  input_params: Record<string, string>
  output: string
  word_count: number | null
  creative_image_url: string | null
  creative_design_brief: string | null
  status: string
  created_at: string
  clients: { name: string } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  seo: 'SEO',
  ads: 'Ads',
  email: 'Email',
  social: 'Social',
}

const CATEGORY_COLORS: Record<string, string> = {
  seo: 'bg-green-500/10 text-green-700 dark:text-green-400',
  ads: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  email: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  social: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
}

type ContentHistoryProps = {
  clients: Client[]
  userRole: string
}

function ContentHistory({ clients, userRole }: ContentHistoryProps) {
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('')
  const [viewingRow, setViewingRow] = useState<HistoryRow | null>(null)
  const canDelete = userRole === 'owner' || userRole === 'admin'

  useEffect(() => {
    fetchHistory()
  }, [categoryFilter, clientFilter])

  async function fetchHistory() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (clientFilter) params.set('clientId', clientFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      const url = `/api/content/history${params.toString() ? `?${params}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.success) {
        setHistory(json.data)
      }
    } catch {
      toast.error('Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/content/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (json.success) {
        setHistory((prev) => prev.filter((r) => r.id !== id))
        if (viewingRow?.id === id) setViewingRow(null)
        toast.success('Deleted')
      } else {
        toast.error(json.error ?? 'Failed to delete')
      }
    } catch {
      toast.error('Network error')
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 py-3">
          <div className="flex gap-1">
            {['all', 'seo', 'ads', 'email', 'social'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Client</Label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="flex h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HistoryIcon className="size-4" />
            Generation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No content generated yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Client</th>
                    <th className="pb-2 pr-4">Category</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Words</th>
                    <th className="pb-2 pr-4">Preview</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => {
                    const date = new Date(row.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    return (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 text-xs text-muted-foreground">{date}</td>
                        <td className="py-2.5 pr-4 text-xs">{row.clients?.name ?? 'Standalone'}</td>
                        <td className="py-2.5 pr-4">
                          <Badge className={`text-[10px] ${CATEGORY_COLORS[row.content_category] ?? ''}`}>
                            {CATEGORY_LABELS[row.content_category] ?? row.content_category}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-xs">{row.content_type.replace(/_/g, ' ')}</td>
                        <td className="py-2.5 pr-4 text-xs">{row.word_count ?? '—'}</td>
                        <td className="max-w-[200px] truncate py-2.5 pr-4 text-xs text-muted-foreground">
                          {row.content_type === 'ad_creative' && row.creative_image_url ? (
                            <div className="flex items-center gap-1">
                              <ImageIcon className="size-3" />
                              <span>Creative</span>
                            </div>
                          ) : (
                            row.output.slice(0, 80) + (row.output.length > 80 ? '...' : '')
                          )}
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setViewingRow(row)}
                              title="View"
                            >
                              <EyeIcon className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleCopy(row.output)}
                              title="Copy"
                            >
                              <CopyIcon className="size-3.5" />
                            </Button>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDelete(row.id)}
                                title="Delete"
                              >
                                <Trash2Icon className="size-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View modal */}
      {viewingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-h-[80vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  {viewingRow.content_type.replace(/_/g, ' ')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={CATEGORY_COLORS[viewingRow.content_category] ?? ''}>
                    {CATEGORY_LABELS[viewingRow.content_category]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {viewingRow.clients?.name ?? 'Standalone'}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setViewingRow(null)}>
                <XIcon className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {viewingRow.creative_image_url && (
                <div className="overflow-hidden rounded-lg border">
                  <img
                    src={viewingRow.creative_image_url}
                    alt="Ad creative"
                    className="w-full object-contain"
                  />
                </div>
              )}
              <pre className="max-h-[400px] overflow-auto rounded-lg border bg-muted/30 p-4 text-xs leading-relaxed whitespace-pre-wrap">
                {viewingRow.output}
              </pre>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleCopy(viewingRow.output)}>
                  <CopyIcon className="size-3.5" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export { ContentHistory }
