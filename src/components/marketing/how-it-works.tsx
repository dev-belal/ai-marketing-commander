'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { UserPlusIcon, FolderOpenIcon, RocketIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Step = {
  number: string
  icon: LucideIcon
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: UserPlusIcon,
    title: 'Request Access',
    description: 'Apply for your team account. We review every request to maintain quality.',
  },
  {
    number: '02',
    icon: FolderOpenIcon,
    title: 'Add Your Clients',
    description: 'Set up brand context in minutes. Voice, ICP, competitors, goals — all in one place.',
  },
  {
    number: '03',
    icon: RocketIcon,
    title: 'Run & Deliver',
    description: 'Audit, generate, export PDF reports. Everything white-labeled with your brand.',
  },
]

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="how-it-works" className="bg-[#F8FAFC] py-24 lg:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="font-[family-name:var(--font-dm-sans)] text-sm font-semibold uppercase tracking-widest text-[#2563EB]">
            The Process
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
            From signup to first report in under 10 minutes
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative mt-20">
          {/* Connecting line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
            className="absolute left-0 right-0 top-16 hidden h-px origin-left bg-gradient-to-r from-transparent via-[#2563EB]/30 to-transparent lg:block"
          />

          <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
            {STEPS.map((step, i) => (
              <StepCard key={step.number} step={step} index={i} inView={inView} />
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
  inView,
}: {
  step: Step
  index: number
  inView: boolean
}) {
  const Icon = step.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.3 + index * 0.2 }}
      className="relative flex flex-col items-center text-center"
    >
      {/* Number + icon circle */}
      <div className="relative">
        <div className="flex size-32 items-center justify-center rounded-full border-2 border-zinc-200 bg-white shadow-sm">
          <Icon className="size-10 text-[#2563EB]" />
        </div>
        <div className="absolute -right-2 -top-2 flex size-10 items-center justify-center rounded-full bg-[#2563EB] font-[family-name:var(--font-syne)] text-sm font-bold text-white shadow-lg shadow-blue-500/30">
          {step.number}
        </div>
      </div>

      <h3 className="mt-6 font-[family-name:var(--font-syne)] text-xl font-bold text-zinc-900">
        {step.title}
      </h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
        {step.description}
      </p>
    </motion.div>
  )
}

export { HowItWorks }
