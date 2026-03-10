'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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

function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsPending(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsPending(false)
    }
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
        style={{
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
            Reset your password
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Enter a new password for your account
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
              <label htmlFor="password" style={labelStyle}>
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isPending}
                autoComplete="new-password"
                minLength={8}
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
              <label htmlFor="confirm-password" style={labelStyle}>
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isPending}
                autoComplete="new-password"
                minLength={8}
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </motion.div>

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
              {isPending ? 'Updating...' : 'Update Password'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export { ResetPasswordForm }