'use client'

import { useState } from 'react'
import { FileDownIcon, LoaderIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

function ExportPdfButton({ auditRunId }: { auditRunId: string }) {
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleExport() {
    setIsGenerating(true)

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditRunId }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error ?? 'Failed to generate PDF.')
        return
      }

      toast.success('PDF report generated successfully.')
      window.open(result.data.pdfUrl, '_blank')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <LoaderIcon className="animate-spin" />
      ) : (
        <FileDownIcon />
      )}
      <span>{isGenerating ? 'Generating PDF...' : 'Export PDF'}</span>
    </Button>
  )
}

export { ExportPdfButton }
