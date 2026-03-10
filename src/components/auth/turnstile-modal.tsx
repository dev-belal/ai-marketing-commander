'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, X } from 'lucide-react'
import { Turnstile } from '@marsidev/react-turnstile'

const CLOUDFLARE_TEST_SITE_KEY = '1x00000000000000000000AA'

interface TurnstileModalProps {
  open: boolean
  siteKey: string
  onSuccess: (token: string) => void
  onClose: () => void
}

function TurnstileModal({ open, siteKey, onSuccess, onClose }: TurnstileModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')

  const resolvedSiteKey = isLocalhost ? CLOUDFLARE_TEST_SITE_KEY : siteKey

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15,23,42,0.4)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              width: '100%',
              maxWidth: '380px',
              boxShadow:
                '0 24px 64px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
              textAlign: 'center',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#475569')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              <X size={18} />
            </button>

            {/* Shield icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(37,99,235,0.08)',
                border: '1px solid rgba(37,99,235,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <ShieldCheck size={28} color="#2563EB" />
            </div>

            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#0F172A',
                margin: '0 0 6px',
                fontFamily: 'var(--font-syne), Syne, sans-serif',
              }}
            >
              Security Verification
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: '#64748B',
                margin: '0 0 24px',
                fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
              }}
            >
              Please complete the check below to continue
            </p>

            {/* Shimmer loading skeleton */}
            {loading && !error && (
              <div
                style={{
                  height: '65px',
                  borderRadius: '8px',
                  background:
                    'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'turnstileShimmer 1.5s ease-in-out infinite',
                  marginBottom: '8px',
                }}
              />
            )}

            {/* Error state */}
            {error && (
              <div
                style={{
                  borderRadius: '10px',
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#DC2626',
                  marginBottom: '12px',
                }}
              >
                Verification failed. Please try again.
              </div>
            )}

            {/* Turnstile widget */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Turnstile
                siteKey={resolvedSiteKey}
                onSuccess={(token) => {
                  setLoading(false)
                  setError(false)
                  onSuccess(token)
                }}
                onError={() => {
                  setLoading(false)
                  setError(true)
                }}
                onWidgetLoad={() => setLoading(false)}
              />
            </div>

            {/* Dev mode bypass */}
            {isLocalhost && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(234,179,8,0.08)',
                  border: '1px solid rgba(234,179,8,0.2)',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: '12px',
                    color: '#B45309',
                    margin: '0 0 8px',
                  }}
                >
                  Dev mode — Turnstile may not load on localhost
                </p>
                <button
                  onClick={() => onSuccess('localhost-bypass-token')}
                  style={{
                    fontSize: '12px',
                    color: '#2563EB',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontFamily: 'inherit',
                  }}
                >
                  Continue without verification
                </button>
              </div>
            )}

            <style>{`
              @keyframes turnstileShimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { TurnstileModal }