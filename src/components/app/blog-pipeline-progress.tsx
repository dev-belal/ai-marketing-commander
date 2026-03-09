'use client'

import { useEffect, useState, useRef } from 'react'
import { CheckCircle2Icon, CircleIcon, LoaderIcon, XCircleIcon } from 'lucide-react'
import type { BlogProgressStep } from '@/types/seo-blog'

type BlogPipelineProgressProps = {
  runId: string
  onComplete: () => void
}

function getStepsFromStatus(status: string, qaScore: number | null, wordCount: number | null, revisionApplied: boolean): BlogProgressStep[] {
  const steps: BlogProgressStep[] = [
    { id: 'research', label: 'Researching Website', status: 'pending' },
    { id: 'keywords', label: 'Building Keywords & Outline', status: 'pending' },
    { id: 'write', label: 'Writing Blog Post', status: 'pending' },
    { id: 'humanize', label: 'Humanizing Content', status: 'pending' },
    { id: 'qa', label: 'Running QA Checks', status: 'pending' },
    { id: 'schema', label: 'Generating Schema', status: 'pending' },
  ]

  const statusOrder: Record<string, number> = {
    pending: -1,
    researching: 0,
    writing: 2,
    humanizing: 3,
    qa_check: 4,
    revising: 4.5,
    complete: 6,
    failed: -1,
  }

  const currentIndex = statusOrder[status] ?? -1

  for (let i = 0; i < steps.length; i++) {
    if (status === 'failed') {
      if (i < Math.max(0, currentIndex)) steps[i].status = 'complete'
      else if (i === Math.max(0, currentIndex)) steps[i].status = 'failed'
    } else if (i < currentIndex) {
      steps[i].status = 'complete'
    } else if (i <= currentIndex && i >= currentIndex) {
      steps[i].status = 'running'
    }
  }

  // Add details to completed steps
  if (wordCount && steps[2].status === 'complete') {
    steps[2].detail = `${wordCount.toLocaleString()} words written`
  }
  if (steps[3].status === 'complete' || steps[3].status === 'running') {
    steps[3].detail = 'Making it sound human...'
  }
  if (qaScore !== null && (steps[4].status === 'complete' || steps[4].status === 'running')) {
    steps[4].detail = `QA Score: ${qaScore}/100`
  }

  // Insert revision step if applicable
  if (revisionApplied || status === 'revising') {
    const revStep: BlogProgressStep = {
      id: 'revision',
      label: 'Applying QA Revisions',
      status: status === 'revising' ? 'running' : revisionApplied ? 'complete' : 'pending',
      detail: revisionApplied ? 'Blog revised and improved' : undefined,
    }
    steps.splice(5, 0, revStep)
  }

  if (status === 'complete') {
    for (const step of steps) {
      step.status = 'complete'
    }
  }

  return steps
}

function BlogPipelineProgress({ runId, onComplete }: BlogPipelineProgressProps) {
  const [steps, setSteps] = useState<BlogProgressStep[]>(
    getStepsFromStatus('pending', null, null, false)
  )
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/seo-blog/status/${runId}`)
        const json = await res.json()

        if (!json.success) {
          setError(json.error ?? 'Failed to fetch status')
          return
        }

        const run = json.data
        const newSteps = getStepsFromStatus(
          run.status,
          run.qa_score,
          run.word_count,
          run.revision_applied
        )
        setSteps(newSteps)

        if (run.status === 'failed') {
          setError(run.error_message ?? 'Pipeline failed')
          if (intervalRef.current) clearInterval(intervalRef.current)
        }

        if (run.status === 'complete') {
          if (intervalRef.current) clearInterval(intervalRef.current)
          onComplete()
        }
      } catch {
        // silently retry on network error
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

function StepIcon({ status }: { status: BlogProgressStep['status'] }) {
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

export { BlogPipelineProgress }
