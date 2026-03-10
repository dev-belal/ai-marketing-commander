'use client'

import { useState, useTransition, useRef } from 'react'
import { motion } from 'framer-motion'
import { Zap, CheckCircle2, Loader, Upload, X } from 'lucide-react'
import { completeOnboarding } from '@/app/actions/onboarding'
import { createBrowserClient } from '@supabase/ssr'
import { DotGridBackground } from '@/components/auth/dot-grid-background'

type BgRemovalPhase = 'idle' | 'loading-model' | 'processing' | 'done' | 'failed'

type OnboardingWizardProps = {
  agencyName: string
  agencyId: string
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '14px 18px',
  color: '#ffffff',
  fontSize: '15px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#94A3B8',
  marginBottom: '6px',
  display: 'block',
}

function handleInputFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = 'rgba(37,99,235,0.6)'
  e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'
}

function handleInputBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = 'rgba(255,255,255,0.1)'
  e.target.style.boxShadow = 'none'
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

    const originalPath = `${agencyId}/original.png`
    const { error: origError } = await supabase.storage
      .from('logos')
      .upload(originalPath, originalFile, { contentType: 'image/png', upsert: true })

    if (origError) {
      setError(`Original logo upload failed: ${origError.message}`)
      return null
    }

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
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080B14',
        overflow: 'hidden',
        padding: '20px',
      }}
    >
      <DotGridBackground />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '40px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          width: '100%',
          maxWidth: '560px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(37,99,235,0.1)',
              border: '1px solid rgba(37,99,235,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={16} color="#2563EB" />
          </div>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#ffffff',
              fontFamily: 'var(--font-syne), Syne, sans-serif',
            }}
          >
            AI Marketing{' '}
            <span style={{ color: '#2563EB' }}>Commander</span>
          </span>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 8px',
              fontFamily: 'var(--font-syne), Syne, sans-serif',
            }}
          >
            Set up your workspace
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Tell us about your agency
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background: 'rgba(255,255,255,0.06)',
            marginBottom: '24px',
          }}
        />

        {error && (
          <div
            style={{
              borderRadius: '10px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#FCA5A5',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Agency Name */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <label htmlFor="agency-name" style={labelStyle}>
              Agency Name
            </label>
            <input
              id="agency-name"
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              placeholder="e.g. Acme Marketing Agency"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </motion.div>

          {/* Logo Upload */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
          >
            <label style={labelStyle}>Agency Logo (optional)</label>
            <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 8px' }}>
              Upload your logo and we&apos;ll automatically remove the background.
            </p>

            {!logoPreview ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  borderRadius: '12px',
                  border: '2px dashed rgba(255,255,255,0.12)',
                  padding: '32px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'
                  e.currentTarget.style.background = 'rgba(37,99,235,0.04)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                }}
              >
                <Upload size={28} color="#64748B" />
                <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
                  Drop your logo here or click to upload
                </p>
                <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
                  PNG, JPG, SVG up to 5MB
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {bgRemovalPhase === 'loading-model' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '10px',
                      background: 'rgba(37,99,235,0.08)',
                      border: '1px solid rgba(37,99,235,0.25)',
                      padding: '8px 14px',
                    }}
                  >
                    <Loader size={14} className="animate-spin" color="#60A5FA" />
                    <span style={{ fontSize: '12px', color: '#93C5FD' }}>
                      Preparing AI background removal (first time only)...
                    </span>
                  </div>
                )}

                <div
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '16px',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <img
                      src={logoPreview}
                      alt="Agency logo"
                      style={{ maxHeight: '112px', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  {isRemoving && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: '12px',
                      }}
                    >
                      <Loader size={24} className="animate-spin" color="#ffffff" />
                      <span style={{ marginTop: '8px', fontSize: '12px', fontWeight: 500, color: '#ffffff' }}>
                        Removing background...
                      </span>
                    </div>
                  )}
                  {bgRemovalPhase === 'done' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderRadius: '999px',
                        background: 'rgba(34,197,94,0.9)',
                        padding: '3px 10px',
                      }}
                    >
                      <CheckCircle2 size={12} color="#ffffff" />
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#ffffff' }}>
                        Background removed
                      </span>
                    </div>
                  )}
                </div>

                {bgRemovalPhase === 'processing' && (
                  <div style={{ maxWidth: '280px' }}>
                    <div
                      style={{
                        height: '6px',
                        width: '100%',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: '999px',
                          background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                          transition: 'width 0.3s',
                          width: `${bgRemovalProgress}%`,
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                      Removing background: {bgRemovalProgress}%
                    </p>
                  </div>
                )}

                <div>
                  <button
                    onClick={handleRemoveLogo}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#94A3B8',
                      cursor: 'pointer',
                      transition: 'background 0.2s, border-color 0.2s',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                    }}
                  >
                    <X size={12} />
                    Remove logo
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              style={{ display: 'none' }}
            />
          </motion.div>

          {/* Finish button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <motion.button
              onClick={handleFinish}
              disabled={isPending}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '13px 32px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isPending ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
                opacity: isPending ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
            >
              {isPending ? 'Setting up...' : 'Finish Setup'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export { OnboardingWizard }