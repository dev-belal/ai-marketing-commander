'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

const PRODUCT_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

const COMPANY_LINKS = [
  { label: 'About 4Pie Labs', href: 'https://fourpielabs.com', external: true },
  { label: 'Twitter / X', href: 'https://x.com', external: true },
  { label: 'LinkedIn', href: 'https://linkedin.com', external: true },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
]

const linkUnderlineVariants = {
  initial: { scaleX: 0, opacity: 0 },
  hovered: { scaleX: 1, opacity: 1 },
}

const linkTextVariants = {
  initial: { color: 'var(--mk-footer-text)' },
  hovered: { color: '#2563EB' },
}

function FooterLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  return (
    <motion.a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      whileHover="hovered"
      initial="initial"
      style={{
        color: 'var(--mk-footer-text)',
        textDecoration: 'none',
        display: 'inline-flex',
        flexDirection: 'column' as const,
        gap: '2px',
      }}
    >
      <motion.span
        className="font-[family-name:var(--font-dm-sans)]"
        variants={linkTextVariants}
        transition={{ duration: 0.15 }}
        style={{ fontSize: '14px' }}
      >
        {label}
      </motion.span>
      <motion.span
        variants={linkUnderlineVariants}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          display: 'block',
          height: '1px',
          background: '#2563EB',
          borderRadius: '1px',
          originX: 0,
          transformOrigin: 'left',
        }}
      />
    </motion.a>
  )
}

function Footer() {
  return (
    <footer className="theme-transition relative" style={{ backgroundColor: 'var(--mk-footer-bg)' }}>
      {/* Gradient top separator line */}
      <div
        className="h-px w-full"
        style={{
          background: 'var(--mk-footer-separator)',
        }}
      />

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Logo */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(37,99,235,0.1)',
                border: '1px solid rgba(37,99,235,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Zap size={14} color="#2563EB" />
              </div>
              <span className="font-[family-name:var(--font-syne)]" style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--mk-footer-heading)',
                whiteSpace: 'nowrap',
              }}>
                AI Marketing{' '}
                <span style={{ color: '#2563EB' }}>Commander</span>
              </span>
            </div>
            <p
              className="mt-2 font-[family-name:var(--font-dm-sans)] text-sm"
              style={{ color: 'var(--mk-footer-text)' }}
            >
              Marketing intelligence, amplified.
            </p>
            <p
              className="mt-4 font-[family-name:var(--font-dm-sans)] text-xs"
              style={{ color: 'var(--mk-footer-muted)' }}
            >
              Built by 4Pie Labs
            </p>
          </div>

          {/* Col 2: Product */}
          <div>
            <p
              className="font-[family-name:var(--font-syne)]"
              style={{
                fontSize: '11px',
                letterSpacing: '2px',
                fontWeight: 600,
                color: 'var(--mk-footer-muted)',
                textTransform: 'uppercase' as const,
                marginBottom: '16px',
              }}
            >
              Product
            </p>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Company */}
          <div>
            <p
              className="font-[family-name:var(--font-syne)]"
              style={{
                fontSize: '11px',
                letterSpacing: '2px',
                fontWeight: 600,
                color: 'var(--mk-footer-muted)',
                textTransform: 'uppercase' as const,
                marginBottom: '16px',
              }}
            >
              Company
            </p>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href} label={link.label} external={link.external} />
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Legal */}
          <div>
            <p
              className="font-[family-name:var(--font-syne)]"
              style={{
                fontSize: '11px',
                letterSpacing: '2px',
                fontWeight: 600,
                color: 'var(--mk-footer-muted)',
                textTransform: 'uppercase' as const,
                marginBottom: '16px',
              }}
            >
              Legal
            </p>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row"
          style={{ borderTop: '1px solid var(--mk-footer-border)' }}
        >
          <p
            className="font-[family-name:var(--font-dm-sans)] text-xs"
            style={{ color: 'var(--mk-footer-muted)' }}
          >
            &copy; 2026 AI Marketing Commander. All rights reserved.
          </p>
          <p
            className="font-[family-name:var(--font-dm-sans)] text-xs"
            style={{ color: 'var(--mk-footer-muted)' }}
          >
            Built with &hearts; in Pakistan
          </p>
        </div>
      </div>
    </footer>
  )
}

export { Footer }