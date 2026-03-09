'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createBrowserClient } from '@supabase/ssr'
import { updateAgencyBranding, type SettingsActionState } from '@/app/actions/settings'
import { CheckCircle2Icon, ClockIcon, LoaderIcon, UploadIcon, XCircleIcon, XIcon } from 'lucide-react'

type AgencyData = {
  id: string
  name: string
  logoUrl: string | null
  logoPendingUrl: string | null
  logoOriginalUrl: string | null
  logoStatus: string
  websiteUrl: string
  primaryColor: string
}

const initialState: SettingsActionState = { error: null, success: false }

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: React.ReactNode }> = {
  none: { label: 'No logo uploaded', variant: 'secondary', icon: null },
  pending: { label: 'Logo pending approval', variant: 'secondary', icon: <ClockIcon className="size-3" /> },
  approved: { label: 'Logo approved', variant: 'default', icon: <CheckCircle2Icon className="size-3" /> },
  rejected: { label: 'Logo rejected — please re-upload', variant: 'destructive', icon: <XCircleIcon className="size-3" /> },
}

function SettingsBrandingForm({ agency }: { agency: AgencyData }) {
  const [state, formAction, isPending] = useActionState(updateAgencyBranding, initialState)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [bgPhase, setBgPhase] = useState<'idle' | 'loading-model' | 'processing' | 'done' | 'failed'>('idle')
  const [bgProgress, setBgProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [primaryColor, setPrimaryColor] = useState(agency.primaryColor)

  useEffect(() => {
    if (state.success) {
      toast.success('Branding updated successfully.')
    }
  }, [state.success])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setOriginalFile(file)
    setProcessedBlob(null)
    setBgPhase('loading-model')
    setBgProgress(0)

    const previewUrl = URL.createObjectURL(file)
    setLogoPreview(previewUrl)

    processBackground(file)
  }

  async function processBackground(file: File) {
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      setBgPhase('processing')

      const resultBlob = await removeBackground(file, {
        output: { format: 'image/png' },
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) setBgProgress(Math.round((current / total) * 100))
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
          if (!ctx) { reject(new Error('Canvas unavailable')); return }
          ctx.drawImage(img, 0, 0)
          canvas.toBlob((pngBlob) => {
            if (!pngBlob) { reject(new Error('PNG conversion failed')); return }
            setProcessedBlob(pngBlob)
            setLogoPreview(URL.createObjectURL(pngBlob))
            URL.revokeObjectURL(blobUrl)
            resolve()
          }, 'image/png')
        }
        img.onerror = () => reject(new Error('Image load failed'))
        img.src = blobUrl
      })

      setBgPhase('done')
    } catch {
      setBgPhase('failed')
    }
  }

  function handleRemoveLogo() {
    setLogoPreview(null)
    setOriginalFile(null)
    setProcessedBlob(null)
    setBgPhase('idle')
    setBgProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave(formData: FormData) {
    if (originalFile) {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Upload original
      const originalPath = `${agency.id}/original.png`
      const { error: origError } = await supabase.storage
        .from('logos')
        .upload(originalPath, originalFile, { contentType: 'image/png', upsert: true })

      if (origError) {
        toast.error(`Original logo upload failed: ${origError.message}`)
        return
      }

      // Upload processed
      const processedFile = processedBlob ?? originalFile
      const processedPath = `${agency.id}/processed.png`
      const { error: procError } = await supabase.storage
        .from('logos')
        .upload(processedPath, processedFile, { contentType: 'image/png', upsert: true })

      if (procError) {
        toast.error(`Processed logo upload failed: ${procError.message}`)
        return
      }

      const { data: origUrl } = supabase.storage.from('logos').getPublicUrl(originalPath)
      const { data: procUrl } = supabase.storage.from('logos').getPublicUrl(processedPath)

      formData.set('logoOriginalUrl', origUrl.publicUrl)
      formData.set('logoPendingUrl', procUrl.publicUrl)
    }

    formAction(formData)
  }

  const isRemoving = bgPhase === 'loading-model' || bgPhase === 'processing'
  const statusInfo = STATUS_BADGE[agency.logoStatus] ?? STATUS_BADGE.none
  const hasNewUpload = !!originalFile
  const showExistingLogo = !hasNewUpload && (agency.logoStatus === 'approved' || agency.logoStatus === 'pending')
  const existingPreviewUrl = agency.logoStatus === 'approved' ? agency.logoUrl : agency.logoPendingUrl

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agency Branding</CardTitle>
        <CardDescription>
          Customize how your agency appears in reports and dashboards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSave} className="space-y-6">
          {state.error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="agency-name">Agency Name</Label>
            <Input
              id="agency-name"
              name="name"
              defaultValue={agency.name}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Agency Logo</Label>
              <Badge variant={statusInfo.variant} className="gap-1">
                {statusInfo.icon}
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Background is automatically removed. Logos require admin approval before use.
            </p>

            {/* Show existing logo when no new upload */}
            {showExistingLogo && !logoPreview && existingPreviewUrl && (
              <div className="space-y-2">
                <div className="inline-block rounded-lg border overflow-hidden">
                  <div className="p-4 bg-muted/50">
                    <img src={existingPreviewUrl} alt="Current logo" className="max-h-28 max-w-full object-contain" />
                  </div>
                </div>
                <div>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <UploadIcon className="size-3" />
                    Re-upload logo
                  </Button>
                </div>
              </div>
            )}

            {/* Upload area for none/rejected or when no existing logo */}
            {!showExistingLogo && !logoPreview && (
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
            )}

            {/* New upload preview */}
            {logoPreview && (
              <div className="space-y-2">
                {bgPhase === 'loading-model' && (
                  <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
                    <LoaderIcon className="size-3.5 animate-spin text-blue-600" />
                    <span className="text-xs text-blue-700">Preparing AI background removal...</span>
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
                  {bgPhase === 'done' && (
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 shadow-sm">
                      <CheckCircle2Icon className="size-3 text-white" />
                      <span className="text-[10px] font-medium text-white">Background removed</span>
                    </div>
                  )}
                </div>

                {bgPhase === 'processing' && (
                  <div className="max-w-xs space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${bgProgress}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Removing background: {bgProgress}%</p>
                  </div>
                )}

                <div>
                  <Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo}>
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

          <div className="space-y-2">
            <Label htmlFor="website-url">Website URL</Label>
            <Input
              id="website-url"
              name="websiteUrl"
              type="url"
              defaultValue={agency.websiteUrl}
              placeholder="https://youragency.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="primary-color"
                name="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-input p-0.5"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="max-w-32 font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export { SettingsBrandingForm }
