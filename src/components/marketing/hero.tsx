'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080B14]">
      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Floating gradient orbs */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-32 top-1/4 size-[500px] rounded-full bg-[#2563EB]/15 blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 30, -30, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-20 top-1/3 size-[400px] rounded-full bg-[#06B6D4]/10 blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, 20, -30, 0],
          y: [0, -20, 40, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 left-1/3 size-[350px] rounded-full bg-[#2563EB]/8 blur-[100px]"
      />

      {/* Content */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-20 mx-auto max-w-4xl px-6 text-center"
      >
        {/* Beta badge */}
        <motion.div variants={fadeUp} className="mb-8 inline-block">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10 px-4 py-1.5 text-sm text-[#60A5FA]">
            <span className="text-xs">&#10022;</span>
            Now in Beta — Limited Access
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="font-[family-name:var(--font-syne)] text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          Your Entire Marketing Team.{' '}
          <span className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent">
            Powered by AI.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl"
        >
          AI Marketing Commander gives SEO and marketing teams superpowers — audit clients,
          generate content, and deliver white-label reports in minutes, not days.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#2563EB] px-8 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-xl hover:shadow-blue-500/25"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative">Request Early Access</span>
          </Link>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-3.5 text-sm font-medium text-zinc-300 transition-all hover:border-white/30 hover:text-white"
          >
            See How It Works
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}

export { Hero }
