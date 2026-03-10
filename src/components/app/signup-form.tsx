'use client'

import { useRef, useState } from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, CheckCircle2 } from 'lucide-react'
import { requestAccess, type RequestAccessState } from '@/app/actions/invite-request'
import { TurnstileModal } from '@/components/auth/turnstile-modal'

const initialState: RequestAccessState = { error: null, success: false }

const BULLETS = [
  'AI-powered marketing audits & reports',
  'Content generation across 18+ formats',
  'White-label PDF exports in seconds',
]

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.8)',
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  padding: '11px 14px',
  color: '#0F172A',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical' as const,
  minHeight: '80px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
  marginBottom: '6px',
  display: 'block',
}

function handleInputFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = '#2563EB'
  e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'
}

function handleInputBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = '#E2E8F0'
  e.target.style.boxShadow = 'none'
}

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: 'easeOut' as const },
})

function SignupForm() {
  const [state, formAction, isPending] = useActionState(requestAccess, initialState)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [showTurnstile, setShowTurnstile] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!turnstileToken && !isLocalhost) {
      e.preventDefault()
      setShowTurnstile(true)
    }
  }

  function handleTurnstileSuccess(token: string) {
    setTurnstileToken(token)
    setShowTurnstile(false)
    setTimeout(() => formRef.current?.requestSubmit(), 50)
  }

  if (state.success) {
    return (
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F0F4FF',
          overflow: 'hidden',
          padding: '20px',
        }}
      >
        {/* Dot grid */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.9)',
            borderRadius: '24px',
            padding: '48px 40px',
            boxShadow:
              '0 4px 6px rgba(37,99,235,0.04), 0 20px 60px rgba(37,99,235,0.08), 0 0 0 1px rgba(255,255,255,0.5) inset',
            width: '100%',
            maxWidth: '440px',
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <CheckCircle2 size={32} color="#22C55E" />
          </div>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#0F172A',
              margin: '0 0 8px',
              fontFamily: 'var(--font-syne), Syne, sans-serif',
            }}
          >
            Request received!
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#64748B',
              margin: '0 0 24px',
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            }}
          >
            We&apos;ll review your request and email you within 24 hours.
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#0F172A',
              textDecoration: 'none',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(37,99,235,0.04)'
              e.currentTarget.style.borderColor = '#CBD5E1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = '#E2E8F0'
            }}
          >
            Back to login
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        background: '#F0F4FF',
        overflow: 'hidden',
      }}
    >
      {/* Keyframe animations */}
      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.08); }
          66% { transform: translate(-30px, 30px) scale(0.95); }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, -40px) scale(1.1); }
        }
        @keyframes floatC {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(30px, -60px); }
        }
        @media (max-width: 768px) {
          .signup-left-col { display: none !important; }
          .signup-right-col { width: 100% !important; }
        }
      `}</style>

      {/* Dot grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Orb 1 */}
      <div
        style={{
          position: 'fixed',
          top: '-80px',
          left: '-80px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at center, rgba(37,99,235,0.35) 0%, rgba(37,99,235,0.15) 40%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'floatA 12s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Orb 2 */}
      <div
        style={{
          position: 'fixed',
          bottom: '-60px',
          right: '-60px',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at center, rgba(6,182,212,0.3) 0%, rgba(6,182,212,0.12) 40%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'floatB 15s ease-in-out infinite',
          animationDelay: '-5s',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Orb 3 */}
      <div
        style={{
          position: 'fixed',
          top: '40%',
          right: '15%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at center, rgba(99,102,241,0.2) 0%, transparent 70%)',
          filter: 'blur(30px)',
          animation: 'floatC 10s ease-in-out infinite',
          animationDelay: '-3s',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* LEFT COLUMN — Branding */}
      <div
        className="signup-left-col"
        style={{
          width: '45%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: '400px' }}>
          {/* Logo */}
          <motion.div {...fadeIn(0)} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(37,99,235,0.1)',
                border: '1px solid rgba(37,99,235,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={20} color="#2563EB" />
            </div>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#0F172A',
                fontFamily: 'var(--font-syne), Syne, sans-serif',
              }}
            >
              AI Marketing{' '}
              <span style={{ color: '#2563EB' }}>Commander</span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeIn(0.1)}
            style={{
              fontSize: '36px',
              fontWeight: 800,
              color: '#0F172A',
              lineHeight: 1.2,
              marginTop: '48px',
              marginBottom: '0',
              fontFamily: 'var(--font-syne), Syne, sans-serif',
            }}
          >
            Get early access.
          </motion.h1>

          {/* Subtext */}
          <motion.p
            {...fadeIn(0.2)}
            style={{
              fontSize: '16px',
              color: '#475569',
              lineHeight: 1.7,
              maxWidth: '340px',
              marginTop: '16px',
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            }}
          >
            Join the invite-only beta and start delivering AI-powered marketing results for your clients.
          </motion.p>

          {/* Bullets */}
          <motion.div {...fadeIn(0.3)} style={{ marginTop: '40px' }}>
            {BULLETS.map((text) => (
              <div
                key={text}
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#2563EB',
                    marginTop: '6px',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '14px',
                    color: '#334155',
                    lineHeight: 1.6,
                    fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Trust line */}
          <motion.p
            {...fadeIn(0.4)}
            style={{
              fontSize: '12px',
              color: '#94A3B8',
              marginTop: '48px',
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            }}
          >
            Limited beta spots available
          </motion.p>
        </div>
      </div>

      {/* RIGHT COLUMN — Signup Card */}
      <div
        className="signup-right-col"
        style={{
          width: '55%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.9)',
            borderRadius: '24px',
            padding: '36px',
            width: '100%',
            maxWidth: '420px',
            boxShadow:
              '0 4px 6px rgba(37,99,235,0.04), 0 20px 60px rgba(37,99,235,0.08), 0 0 0 1px rgba(255,255,255,0.5) inset',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Beta badge */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '999px',
                border: '1px solid rgba(37,99,235,0.2)',
                backgroundColor: 'rgba(37,99,235,0.06)',
                fontSize: '12px',
                color: '#2563EB',
                fontWeight: 500,
              }}
            >
              &#10022; Invite-Only Beta
            </span>
          </div>

          {/* Card Header */}
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: '6px',
              textAlign: 'center',
              fontFamily: 'var(--font-syne), Syne, sans-serif',
            }}
          >
            Request Beta Access
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#64748B',
              marginBottom: '24px',
              textAlign: 'center',
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            }}
          >
            Tell us about your agency
          </p>

          <form ref={formRef} action={formAction} onSubmit={handleFormSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {state.error && (
                <div
                  style={{
                    borderRadius: '10px',
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#DC2626',
                  }}
                >
                  {state.error}
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <label htmlFor="name" style={labelStyle}>
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jane Smith"
                  required
                  disabled={isPending}
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <label htmlFor="email" style={labelStyle}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@agency.com"
                  required
                  disabled={isPending}
                  autoComplete="email"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <label style={labelStyle}>Account type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label
                    htmlFor="account-solo"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, background 0.2s',
                      background: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        id="account-solo"
                        name="accountType"
                        value="solo"
                        defaultChecked
                        disabled={isPending}
                        className="accent-[#2563EB]"
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                        Solo
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                      Just me, managing clients
                    </p>
                  </label>
                  <label
                    htmlFor="account-team"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, background 0.2s',
                      background: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        id="account-team"
                        name="accountType"
                        value="team"
                        disabled={isPending}
                        className="accent-[#2563EB]"
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                        Team
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                      Multiple team members
                    </p>
                  </label>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <label htmlFor="company" style={labelStyle}>
                  Company name
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  placeholder="Acme Marketing"
                  disabled={isPending}
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <label htmlFor="reason" style={labelStyle}>
                  Why do you want access?
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  placeholder="Tell us about your agency and what you're looking for..."
                  rows={3}
                  disabled={isPending}
                  style={textareaStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </motion.div>

              <input type="hidden" name="turnstileToken" value={turnstileToken ?? ''} />

              <motion.button
                type="submit"
                disabled={isPending}
                whileHover={{ scale: 1.01, boxShadow: '0 6px 24px rgba(37,99,235,0.4)' }}
                whileTap={{ scale: 0.99 }}
                style={{
                  background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: 600,
                  width: '100%',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s, transform 0.1s',
                  opacity: isPending ? 0.6 : 1,
                  fontFamily: 'inherit',
                  marginTop: '4px',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                }}
              >
                {isPending ? 'Submitting...' : 'Request Access'}
              </motion.button>

              <p
                style={{
                  textAlign: 'center',
                  fontSize: '13px',
                  color: '#64748B',
                  marginTop: '4px',
                  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                }}
              >
                Already have an account?{' '}
                <Link
                  href="/login"
                  style={{ color: '#2563EB', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Turnstile Modal */}
      {siteKey && (
        <TurnstileModal
          open={showTurnstile}
          siteKey={siteKey}
          onSuccess={handleTurnstileSuccess}
          onClose={() => setShowTurnstile(false)}
        />
      )}
    </div>
  )
}

export { SignupForm }