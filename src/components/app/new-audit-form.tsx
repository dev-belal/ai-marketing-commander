'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const AUDIT_TYPES = [
  {
    value: 'full',
    label: 'Full Audit',
    description: 'SEO + Content + Technical (3 parallel agents)',
  },
  {
    value: 'seo',
    label: 'SEO Only',
    description: 'Keyword strategy, on-page SEO, competitor analysis',
  },
  {
    value: 'content',
    label: 'Content Only',
    description: 'Content-market fit, brand voice, content gaps',
  },
  {
    value: 'technical',
    label: 'Technical Only',
    description: 'Performance, CRO, analytics, automation',
  },
] as const

type Client = {
  id: string
  name: string
  website_url: string | null
  industry: string | null
}

type Mode = 'client' | 'standalone'

function NewAuditForm({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('client')
  const [clientId, setClientId] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [auditType, setAuditType] = useState('full')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Auto-fill website URL when client changes
  useEffect(() => {
    if (mode === 'client' && clientId) {
      const client = clients.find((c) => c.id === clientId)
      if (client?.website_url) {
        setWebsiteUrl(client.website_url)
      }
    }
  }, [clientId, clients, mode])

  function handleSubmit() {
    if (mode === 'client' && !clientId) {
      setError('Please select a client.')
      return
    }
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL.')
      return
    }

    setError(null)

    startTransition(async () => {
      const response = await fetch('/api/audits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: mode === 'client' ? clientId : null,
          websiteUrl: websiteUrl.trim(),
          auditType,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error ?? 'Audit failed. Please try again.')
        return
      }

      router.push(`/audits/${result.data.auditRunId}`)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Configuration</CardTitle>
        <CardDescription>
          Choose the type of audit to run.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex rounded-full border p-0.5">
          <button
            type="button"
            onClick={() => setMode('client')}
            disabled={isPending}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'client'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            } disabled:opacity-50`}
          >
            For a Client
          </button>
          <button
            type="button"
            onClick={() => setMode('standalone')}
            disabled={isPending}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'standalone'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            } disabled:opacity-50`}
          >
            Standalone
          </button>
        </div>

        {mode === 'client' && (
          <div className="space-y-2">
            <Label htmlFor="client-select">Client</Label>
            {clients.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No clients found. Add a client first or switch to Standalone mode.
              </p>
            ) : (
              <select
                id="client-select"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={isPending}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="website-url">Website URL</Label>
          <Input
            id="website-url"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            disabled={isPending}
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-2">
          <Label>Audit Type</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {AUDIT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                disabled={isPending}
                onClick={() => setAuditType(type.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  auditType === type.value
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-primary/50'
                } disabled:opacity-50`}
              >
                <p className="text-sm font-medium">{type.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {isPending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Running audit agents...</span>
            </div>
            <Progress value={null} />
            <p className="text-xs text-muted-foreground">
              {auditType === 'full'
                ? '3 agents running in parallel: SEO, Content, Technical'
                : `Running ${auditType} agent...`}
            </p>
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? 'Running Audit...' : 'Start Audit'}
        </Button>
      </CardContent>
    </Card>
  )
}

export { NewAuditForm }
