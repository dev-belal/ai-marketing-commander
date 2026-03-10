'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { IconArrowRight, IconChevronDown } from '@tabler/icons-react'

const HeroScene = dynamic(() => import('@/components/landing/hero-3d-scene'), {
  ssr: false,
})

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setMousePosition({ x, y })
  }, [])

  return (
    <section
      onMouseMove={handleMouseMove}
      className="hero-section relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080B14] pb-[80px] pt-[80px]"
    >
      {/* Layer 1 — 3D Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="absolute inset-0 z-0"
      >
        <HeroScene mouseX={mousePosition.x} mouseY={mousePosition.y} />
      </motion.div>

      {/* Layer 2 — Gradient overlays */}
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080B14] via-transparent to-transparent" style={{ height: '30%' }} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#080B14] via-transparent to-transparent" style={{ height: '40%' }} />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(37,99,235,0.12) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Layer 3 — Grain texture */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Layer 4 — Content */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-4xl px-6 text-center"
      >
        {/* Badge */}
        <motion.div variants={fadeUp}>
          <div className="hero-badge" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(96, 165, 250, 0.35)',
            backgroundColor: 'rgba(96, 165, 250, 0.08)',
            marginBottom: '24px',
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#60A5FA',
              display: 'inline-block',
              animation: 'hero-pulse 2s infinite',
            }} />
            <span style={{
              fontSize: '13px',
              color: '#93C5FD',
              fontWeight: 500,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}>
              &#10022; Now in Beta — Limited Access
            </span>
          </div>
          <style>{`
            @keyframes hero-pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.4; transform: scale(0.85); }
            }
          `}</style>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="mx-auto font-[family-name:var(--font-syne)] tracking-tight text-white"
          style={{
            fontSize: 'clamp(28px, 4vw, 54px)',
            fontWeight: 700,
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
          }}
        >
          Your Marketing Team.
          <br />
          <span style={{ color: '#60A5FA' }}>Powered by AI.</span>
          <style>{`
            @media (max-width: 768px) {
              h1 { white-space: normal !important; font-size: clamp(28px, 8vw, 40px) !important; }
            }
          `}</style>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-6 max-w-[560px] font-[family-name:var(--font-dm-sans)] text-[17px] leading-[1.7] text-[#94A3B8]"
        >
          AI Marketing Commander gives SEO and marketing teams superpowers — audit clients,
          generate content, and deliver white-label reports in minutes, not days.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#2563EB] to-[#06B6D4] px-7 py-3.5 font-[family-name:var(--font-syne)] text-[15px] font-semibold text-white transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
          >
            Request Early Access
          </Link>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="group inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-7 py-3.5 text-[15px] font-medium text-zinc-300 transition-all duration-200 hover:border-white/30 hover:bg-white/5 hover:text-white"
          >
            See How It Works
            <IconArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </motion.div>

        {/* Stats pill */}
        <motion.div variants={fadeUp}>
          <div className="hero-stats-pill" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0px',
            marginTop: '48px',
            padding: '14px 28px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '999px',
            backdropFilter: 'blur(10px)',
            width: 'fit-content',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px' }}>
              <span className="stat-number" style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-syne), Syne, sans-serif' }}>500+</span>
              <span className="stat-label" style={{ fontSize: '13px', color: '#64748B' }}>Hours Saved</span>
            </div>
            <div className="stat-divider" style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px' }}>
              <span className="stat-number" style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-syne), Syne, sans-serif' }}>10x</span>
              <span className="stat-label" style={{ fontSize: '13px', color: '#64748B' }}>Faster Reports</span>
            </div>
            <div className="stat-divider" style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px' }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#22C55E',
                display: 'inline-block',
                boxShadow: '0 0 6px rgba(34,197,94,0.6)',
                animation: 'hero-pulse 2s infinite',
              }} />
              <span className="stat-label" style={{ fontSize: '13px', color: '#64748B' }}>
                Beta Access <span className="stat-open" style={{ color: '#22C55E', fontWeight: 600 }}>Open</span>
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-[family-name:var(--font-dm-sans)] text-[11px] tracking-widest text-[#64748B]">
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <IconChevronDown className="size-4 text-[#64748B]" />
        </motion.div>
      </motion.div>
    </section>
  )
}

export { Hero }