'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { IconUserCheck, IconSettings, IconRocket } from '@tabler/icons-react'
import type { Icon } from '@tabler/icons-react'

type Step = {
  number: string
  icon: Icon
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: IconUserCheck,
    title: 'Request Access',
    description:
      'Apply for your beta account. We review and send your personal invite within 24 hours.',
  },
  {
    number: '02',
    icon: IconSettings,
    title: 'Set Up Your Clients',
    description:
      'Add clients, set brand context — voice, ICP, keywords, competitors. Takes 3 minutes per client.',
  },
  {
    number: '03',
    icon: IconRocket,
    title: 'Run, Generate & Deliver',
    description:
      'Audit, generate content, export white-label PDF reports. Impress clients from day one.',
  },
]

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="how-it-works"
      className="theme-transition py-24 lg:py-32"
      style={{ backgroundColor: 'var(--mk-section-bg-alt)' }}
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
            The Process
          </p>
          <h2
            className="mt-4 font-[family-name:var(--font-dm-sans)] text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[48px]"
            style={{ color: 'var(--mk-section-heading)' }}
          >
            From signup to first report in under{' '}
            <span style={{ fontVariantNumeric: 'normal', fontFeatureSettings: '"tnum" 0' }}>
              10
            </span>{' '}
            minutes
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative mt-20">
          {/* Connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-[28px] hidden lg:block">
            {/* Base line */}
            <div className="h-[2px] w-full" style={{ backgroundColor: 'var(--mk-section-line)' }} />
            {/* Animated gradient line */}
            <motion.div
              initial={{ width: '0%' }}
              animate={inView ? { width: '100%' } : { width: '0%' }}
              transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
              className="absolute left-0 top-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, #2563EB, #0EA5E9)',
                originX: 0,
              }}
            />
          </div>

          <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
            {STEPS.map((step, i) => (
              <StepCard key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function StepCard({
  step,
  index,
}: {
  step: Step
  index: number
}) {
  const Icon = step.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.3 }}
      viewport={{ once: true }}
      className="relative flex flex-col items-center text-center"
    >
      {/* Big background number */}
      <div
        className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 select-none font-[family-name:var(--font-syne)] text-[80px] font-black leading-none"
        style={{ color: 'var(--mk-section-number-color)' }}
      >
        {step.number}
      </div>

      {/* Icon circle */}
      <div
        className="relative z-10 flex items-center justify-center rounded-full"
        style={{
          width: 56,
          height: 56,
          background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)',
          boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
        }}
      >
        <Icon className="text-white" style={{ width: 22, height: 22 }} stroke={1.5} />
      </div>

      <h3
        className="mt-6 font-[family-name:var(--font-syne)] text-[22px] font-bold"
        style={{ color: 'var(--mk-section-heading)' }}
      >
        {step.title}
      </h3>
      <p
        className="mt-2 max-w-xs font-[family-name:var(--font-dm-sans)] text-[15px] leading-relaxed"
        style={{ color: 'var(--mk-section-text)' }}
      >
        {step.description}
      </p>
    </motion.div>
  )
}

export { HowItWorks }