'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  IconBolt,
  IconBrain,
  IconFileText,
  IconPencil,
  IconUsers,
  IconSearch,
} from '@tabler/icons-react'
import type { Icon } from '@tabler/icons-react'

type Feature = {
  icon: Icon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: IconBolt,
    title: 'AI Marketing Audits',
    description:
      'Run comprehensive 5-dimension audits in minutes, not days. Score every client automatically.',
  },
  {
    icon: IconBrain,
    title: 'Brand Context Engine',
    description:
      "Every output locked to your client's voice, ICP, and goals. No more generic AI content.",
  },
  {
    icon: IconFileText,
    title: 'White-Label Reports',
    description:
      'Professional PDF reports with your agency logo. Generated in under 60 seconds.',
  },
  {
    icon: IconPencil,
    title: 'Content Generation',
    description:
      'Blogs, ads, emails, social — all on-brand, all in one place.',
  },
  {
    icon: IconUsers,
    title: 'Team Collaboration',
    description:
      'Roles, permissions, shared workspace. Built for real agency workflows.',
  },
  {
    icon: IconSearch,
    title: 'SEO Blog Generator',
    description:
      'Research, write, humanize, and QA-check blog posts automatically.',
  },
]

function Features() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="features"
      className="theme-transition py-24 lg:py-32"
      style={{ backgroundColor: 'var(--mk-section-bg)' }}
    >
      <div ref={ref} className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p
            className="font-[family-name:var(--font-syne)] text-[11px] font-semibold uppercase tracking-[3px]"
            style={{ color: 'var(--mk-accent)' }}
          >
            Everything Your Team Needs
          </p>
          <h2
            className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[48px]"
            style={{ color: 'var(--mk-section-heading)' }}
          >
            One platform. Every marketing workflow.
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  feature,
  index,
  inView,
}: {
  feature: Feature
  index: number
  inView: boolean
}) {
  const Icon = feature.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{
        y: -6,
        boxShadow: '0 20px 40px rgba(37,99,235,0.1)',
        transition: { duration: 0.2 },
      }}
      className="theme-transition group rounded-2xl p-7 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--mk-section-card-bg)',
        border: '1px solid var(--mk-section-card-border)',
      }}
    >
      <div
        className="flex size-12 items-center justify-center rounded-xl transition-shadow duration-200 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.15)]"
        style={{
          background: `linear-gradient(to bottom right, var(--mk-section-icon-bg-from), var(--mk-section-icon-bg-to))`,
          color: 'var(--mk-accent)',
        }}
      >
        <Icon className="size-6" stroke={1.5} />
      </div>
      <h3
        className="mt-5 font-[family-name:var(--font-syne)] text-lg font-bold"
        style={{ color: 'var(--mk-section-heading)' }}
      >
        {feature.title}
      </h3>
      <p
        className="mt-2 font-[family-name:var(--font-dm-sans)] text-[14px] leading-relaxed"
        style={{ color: 'var(--mk-section-text)' }}
      >
        {feature.description}
      </p>
    </motion.div>
  )
}

export { Features }