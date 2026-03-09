'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeOnboarding } from '@/app/actions/onboarding'
import { createBrowserClient } from '@supabase/ssr'
import { CheckCircle2Icon, LoaderIcon, UploadIcon, XIcon } from 'lucide-react'

type BgRemovalPhase = 'idle' | 'loading-model' | 'processing' | 'done' | 'failed'

type OnboardingWizardProps = {
  agencyName: string
  agencyId: string
}

function OnboardingWizard({ agencyName, agencyId }: OnboardingWizardProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [agency, setAgency] = useState(agencyName)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [bgRemovalPhase, setBgRemovalPhase] = useState<BgRemovalPhase>('idle')
  const [bgRemovalProgress, setBgRemovalProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setOriginalFile(file)
    setProcessedBlob(null)
    setBgRemovalPhase('loading-model')
    setBgRemovalProgress(0)

    const previewUrl = URL.createObjectURL(file)
    setLogoPreview(previewUrl)

    processBackground(file)
  }

  async function processBackground(file: File) {
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      setBgRemovalPhase('processing')

      const resultBlob = await removeBackground(file, {
        output: { format: 'image/png' },
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) {
            setBgRemovalProgress(Math.round((current / total) * 100))
          }
        },
      })

      const img = new Image()
      const blobUrl = URL.createObjectURL(resultBlob)

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) { reject(new Error('Canvas context unavailable')); return }
          ctx.drawImage(img, 0, 0)
          canvas.toBlob(
            (pngBlob) => {
              if (!pngBlob) { reject(new Error('Failed to convert to PNG')); return }
              setProcessedBlob(pngBlob)
              setLogoPreview(URL.createObjectURL(pngBlob))
              URL.revokeObjectURL(blobUrl)
              resolve()
            },
            'image/png'
          )
        }
        img.onerror = () => reject(new Error('Failed to load processed image'))
        img.src = blobUrl
      })

      setBgRemovalPhase('done')
    } catch {
      setBgRemovalPhase('failed')
    }
  }

  function handleRemoveLogo() {
    setLogoPreview(null)
    setOriginalFile(null)
    setProcessedBlob(null)
    setBgRemovalPhase('idle')
    setBgRemovalProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadLogos(): Promise<{ originalUrl: string; processedUrl: string } | null> {
    if (!originalFile) return null

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Upload original
    const originalPath = `${agencyId}/original.png`
    const { error: origError } = await supabase.storage
      .from('logos')
      .upload(originalPath, originalFile, { contentType: 'image/png', upsert: true })

    if (origError) {
      setError(`Original logo upload failed: ${origError.message}`)
      return null
    }

    // Upload processed (or original if bg removal failed)
    const processedFile = processedBlob ?? originalFile
    const processedPath = `${agencyId}/processed.png`
    const { error: procError } = await supabase.storage
      .from('logos')
      .upload(processedPath, processedFile, { contentType: 'image/png', upsert: true })

    if (procError) {
      setError(`Processed logo upload failed: ${procError.message}`)
      return null
    }

    const { data: origUrl } = supabase.storage.from('logos').getPublicUrl(originalPath)
    const { data: procUrl } = supabase.storage.from('logos').getPublicUrl(processedPath)

    return { originalUrl: origUrl.publicUrl, processedUrl: procUrl.publicUrl }
  }

  function handleFinish() {
    setError(null)

    if (!agency.trim()) {
      setError('Agency name is required.')
      return
    }

    startTransition(async () => {
      let logoOriginalUrl: string | null = null
      let logoPendingUrl: string | null = null

      if (originalFile) {
        const urls = await uploadLogos()
        if (!urls) return
        logoOriginalUrl = urls.originalUrl
        logoPendingUrl = urls.processedUrl
      }

      const result = await completeOnboarding({
        agencyName: agency.trim(),
        logoOriginalUrl,
        logoPendingUrl,
      })

      if (result?.error) {
        setError(result.error)
      }
    })
  }

  const isRemoving = bgRemovalPhase === 'loading-model' || bgRemovalPhase === 'processing'

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agency Details</CardTitle>
          <CardDescription>
            Tell us about your agency. You can update these later in Settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agency-name">Agency Name</Label>
            <Input
              id="agency-name"
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              placeholder="Acme Marketing"
            />
          </div>

          <div className="space-y-2">
            <Label>Agency Logo (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Upload your logo and we&apos;ll automatically remove the background. Your logo will be reviewed before appearing in dashboards.
            </p>

            {!logoPreview ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-8 transition-colors hover:border-muted-foreground/50"
              >
                <UploadIcon className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload PNG, JPG, or WEBP</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bgRemovalPhase === 'loading-model' && (
                  <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
                    <LoaderIcon className="size-3.5 animate-spin text-blue-600" />
                    <span className="text-xs text-blue-700">
                      Preparing AI background removal (first time only)...
                    </span>
                  </div>
                )}

                <div className="relative inline-block rounded-lg border overflow-hidden">
                  <div className="p-4 bg-muted/50">
                    <img src={logoPreview} alt="Agency logo" className="max-h-28 max-w-full object-contain" />
                  </div>
                  {isRemoving && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
                      <LoaderIcon className="size-6 animate-spin text-white" />
                      <span className="mt-1.5 text-xs font-medium text-white">Removing background...</span>
                    </div>
                  )}
                  {bgRemovalPhase === 'done' && (
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 shadow-sm">
                      <CheckCircle2Icon className="size-3 text-white" />
                      <span className="text-[10px] font-medium text-white">Background removed</span>
                    </div>
                  )}
                </div>

                {bgRemovalPhase === 'processing' && (
                  <div className="max-w-xs space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${bgRemovalProgress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Removing background: {bgRemovalProgress}%</p>
                  </div>
                )}

                <div>
                  <Button variant="outline" size="sm" onClick={handleRemoveLogo}>
                    <XIcon className="size-3" />
                    Remove logo
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleFinish} disabled={isPending}>
              {isPending ? 'Setting up...' : 'Finish Setup'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { OnboardingWizard }
