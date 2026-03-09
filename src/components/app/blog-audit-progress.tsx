'use client'

import { useEffect, useState, useRef } from 'react'
import { CheckCircle2Icon, CircleIcon, LoaderIcon, XCircleIcon } from 'lucide-react'

type Step = {
  id: string
  label: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  detail?: string
}

type BlogAuditProgressProps = {
  runId: string
  onComplete: () => void
}

function getStepsFromStatus(status: string): Step[] {
  const steps: Step[] = [
    { id: 'scrape', label: 'Scraping Page', status: 'pending', detail: 'Fetching and parsing the URL' },
    { id: 'analyze', label: 'Running Audit Checks', status: 'pending', detail: 'Analyzing content for SEO issues' },
    { id: 'recommend', label: 'Generating Recommendations', status: 'pending', detail: 'AI-powered suggestions' },
  ]

  const statusOrder: Record<string, number> = {
    pending: -1,
    scraping: 0,
    analyzing: 1,
    complete: 3,
    failed: -1,
  }

  const currentIndex = statusOrder[status] ?? -1

  for (let i = 0; i < steps.length; i++) {
    if (status === 'failed') {
      if (i < Math.max(0, currentIndex)) steps[i].status = 'complete'
      else if (i === Math.max(0, currentIndex)) steps[i].status = 'failed'
    } else if (status === 'complete') {
      steps[i].status = 'complete'
    } else if (i < currentIndex) {
      steps[i].status = 'complete'
    } else if (i === currentIndex) {
      steps[i].status = 'running'
    }
  }

  // Analyzing covers both audit engine + AI recs, so mark recommend as running at analyzing stage
  if (status === 'analyzing' && steps[1].status === 'running') {
    // keep step 2 pending — it starts after analyze
  }

  return steps
}

function BlogAuditProgress({ runId, onComplete }: BlogAuditProgressProps) {
  const [steps, setSteps] = useState<Step[]>(getStepsFromStatus('pending'))
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/blog-audit/status/${runId}`)
        const json = await res.json()

        if (!json.success) {
          setError(json.error ?? 'Failed to fetch status')
          return
        }

        const run = json.data
        setSteps(getStepsFromStatus(run.status))

        if (run.status === 'failed') {
          setError(run.error_message ?? 'Audit failed')
          if (intervalRef.current) clearInterval(intervalRef.current)
        }

        if (run.status === 'complete') {
          if (intervalRef.current) clearInterval(intervalRef.current)
          onComplete()
        }
      } catch {
        // silently retry
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [runId, onComplete])

  return (
    <div className="space-y-1">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-start gap-3 py-2">
          <div className="flex flex-col items-center">
            <StepIcon status={step.status} />
            {i < steps.length - 1 && (
              <div
                className={`mt-1 h-6 w-px ${
                  step.status === 'complete' ? 'bg-green-500' : 'bg-zinc-200'
                }`}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-medium ${
                step.status === 'running'
                  ? 'text-blue-600'
                  : step.status === 'complete'
                    ? 'text-zinc-900'
                    : step.status === 'failed'
                      ? 'text-red-600'
                      : 'text-zinc-400'
              }`}
            >
              {step.label}
            </p>
            {step.detail && (
              <p className="text-xs text-muted-foreground">{step.detail}</p>
            )}
          </div>
        </div>
      ))}

      {error && (
        <div className="mt-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}

function StepIcon({ status }: { status: Step['status'] }) {
  switch (status) {
    case 'complete':
      return <CheckCircle2Icon className="size-5 text-green-500" />
    case 'running':
      return <LoaderIcon className="size-5 animate-spin text-blue-600" />
    case 'failed':
      return <XCircleIcon className="size-5 text-red-500" />
    default:
      return <CircleIcon className="size-5 text-zinc-300" />
  }
}

export { BlogAuditProgress }
