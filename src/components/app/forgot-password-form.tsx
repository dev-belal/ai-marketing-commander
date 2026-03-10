'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Turnstile } from '@marsidev/react-turnstile'
import { OrbBackground } from '@/components/auth/orb-background'

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '12px 16px',
  color: '#ffffff',
  fontSize: '14px',
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

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Email is required.')
      return
    }

    if (siteKey && !turnstileToken) {
      setError('Please complete the security check.')
      return
    }

    setIsPending(true)

    try {
      const supabase = createClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/auth/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '40px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
    width: '100%',
    maxWidth: '440px',
    position: 'relative',
    zIndex: 10,
  }

  if (success) {
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
        <OrbBackground />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ ...cardStyle, textAlign: 'center', padding: '48px 40px' }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
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
              color: '#ffffff',
              margin: '0 0 8px',
              fontFamily: 'var(--font-syne), Syne, sans-serif',
            }}
          >
            Check your email
          </h2>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 24px', lineHeight: 1.6 }}>
            We sent a password reset link to <strong style={{ color: '#ffffff' }}>{email}</strong>.
            <br />
            Check your inbox and spam folder.
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#ffffff',
              textDecoration: 'none',
              transition: 'background 0.2s, border-color 0.2s',
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
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080B14',
        overflow: 'hidden',
        padding: '20px',
      }}
    >
      <OrbBackground />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={cardStyle}
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
            Forgot password
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div
          style={{
            height: '1px',
            background: 'rgba(255,255,255,0.06)',
            marginBottom: '24px',
          }}
        />

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div
                style={{
                  borderRadius: '10px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#FCA5A5',
                }}
              >
                {error}
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <label htmlFor="email" style={labelStyle}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                required
                disabled={isPending}
                autoComplete="email"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </motion.div>

            {siteKey && (
              <Turnstile
                siteKey={siteKey}
                onSuccess={(token) => setTurnstileToken(token)}
                options={{ appearance: 'interaction-only' }}
              />
            )}

            <motion.button
              type="submit"
              disabled={isPending}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '13px 24px',
                fontSize: '14px',
                fontWeight: 600,
                width: '100%',
                cursor: isPending ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
                opacity: isPending ? 0.6 : 1,
                fontFamily: 'inherit',
                marginTop: '4px',
              }}
            >
              {isPending ? 'Sending...' : 'Send Reset Link'}
            </motion.button>

            <p
              style={{
                textAlign: 'center',
                fontSize: '13px',
                color: '#64748B',
                margin: '4px 0 0',
              }}
            >
              Remember your password?{' '}
              <Link
                href="/login"
                style={{ color: '#60A5FA', textDecoration: 'none' }}
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
  )
}

export { ForgotPasswordForm }