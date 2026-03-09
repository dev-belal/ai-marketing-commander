'use client'

import { useState } from 'react'
import { DownloadIcon, LoaderIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

function DownloadReportButton({ storagePath }: { storagePath: string }) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleDownload() {
    setIsLoading(true)

    try {
      const response = await fetch('/api/reports/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error ?? 'Failed to download report.')
        return
      }

      window.open(result.data.url, '_blank')
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={isLoading}>
      {isLoading ? (
        <LoaderIcon className="animate-spin" />
      ) : (
        <DownloadIcon />
      )}
      <span>Download</span>
    </Button>
  )
}

export { DownloadReportButton }
