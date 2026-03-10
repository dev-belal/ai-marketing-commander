'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'

const SECTIONS = [
  {
    title: 'Introduction',
    content:
      "AI Marketing Commander ('we', 'our', or 'us') is operated by 4Pie Labs. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at aimarketing.fourpielabs.com. Please read this policy carefully. If you disagree with its terms, please discontinue use of the platform.",
  },
  {
    title: 'Information We Collect',
    content:
      'We collect information you provide directly, including: name, email address, company name, and any content you create or upload within the platform. We also automatically collect usage data, IP addresses, browser type, and interaction data to improve our services and ensure platform security.',
  },
  {
    title: 'How We Use Your Information',
    content:
      'We use collected information to: provide and maintain the platform, process your account registration and invitations, send transactional emails (password resets, invite confirmations), improve platform features based on usage patterns, detect and prevent fraudulent or abusive activity, and communicate platform updates relevant to your account.',
  },
  {
    title: 'Data Storage & Security',
    content:
      'Your data is stored securely using Supabase infrastructure with row-level security policies. We implement industry-standard encryption for data in transit (TLS) and at rest. While we take reasonable precautions, no method of transmission over the internet is 100% secure.',
  },
  {
    title: 'Third-Party Services',
    content:
      'Our platform integrates with the following third-party services: Anthropic (AI content generation), OpenAI (image generation), Resend (transactional email), Stripe (future payment processing), and Cal.com (consultation booking). Each service operates under its own privacy policy. We do not sell your personal data to third parties.',
  },
  {
    title: 'Cookies & Tracking',
    content:
      'We use essential cookies for authentication and session management. We do not use third-party advertising cookies or tracking pixels. You may disable cookies in your browser settings, though this may affect platform functionality.',
  },
  {
    title: 'Your Rights',
    content:
      'Depending on your jurisdiction, you may have the right to: access the personal data we hold about you, request correction of inaccurate data, request deletion of your account and associated data, and object to certain processing activities. To exercise these rights, contact us at privacy@fourpielabs.com.',
  },
  {
    title: 'Changes to This Policy',
    content:
      'We may update this Privacy Policy periodically. We will notify registered users of material changes via email. Continued use of the platform after updates constitutes acceptance of the revised policy.',
  },
  {
    title: 'Contact Us',
    content:
      'For privacy-related questions or requests, contact 4Pie Labs at: privacy@fourpielabs.com or visit fourpielabs.com.',
  },
]

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      {/* Hero Header */}
      <div
        className="legal-hero"
        style={{
          background: '#080B14',
          paddingTop: '120px',
          paddingBottom: '80px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          className="font-[family-name:var(--font-syne)]"
          style={{
            position: 'relative',
            display: 'inline-block',
            fontSize: '11px',
            letterSpacing: '3px',
            color: '#2563EB',
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            marginBottom: '16px',
          }}
        >
          Legal
        </div>
        <h1
          className="font-[family-name:var(--font-syne)]"
          style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 16px',
            lineHeight: 1.1,
          }}
        >
          Privacy Policy
        </h1>
        <p
          className="font-[family-name:var(--font-dm-sans)]"
          style={{
            fontSize: '14px',
            color: '#475569',
          }}
        >
          Last updated: March 10, 2026
        </p>
      </div>

      {/* Content Area */}
      <div
        className="legal-content"
        style={{
          background: 'var(--mk-bg-secondary)',
          minHeight: '60vh',
        }}
      >
        <div
          style={{
            maxWidth: '780px',
            margin: '0 auto',
            padding: '80px 40px',
          }}
        >
          {SECTIONS.map((section) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              style={{ marginBottom: '48px' }}
            >
              <h2
                className="font-[family-name:var(--font-syne)]"
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--mk-text-primary)',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--mk-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span
                  style={{
                    width: '4px',
                    height: '20px',
                    borderRadius: '2px',
                    background: 'linear-gradient(180deg, #2563EB, #06B6D4)',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                {section.title}
              </h2>
              <p
                className="font-[family-name:var(--font-dm-sans)]"
                style={{
                  fontSize: '15px',
                  color: 'var(--mk-text-secondary)',
                  lineHeight: 1.8,
                  marginBottom: '12px',
                }}
              >
                {section.content}
              </p>
            </motion.section>
          ))}
        </div>
      </div>

      <Footer />
    </>
  )
}