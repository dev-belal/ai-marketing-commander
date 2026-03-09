'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  SearchIcon,
  PaletteIcon,
  FileTextIcon,
  PenToolIcon,
  UsersIcon,
  LayoutDashboardIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Feature = {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: SearchIcon,
    title: 'AI Marketing Audits',
    description: 'Run 5-dimension audits in minutes. SEO, content, social, technical, and competitive — all analyzed by AI.',
  },
  {
    icon: PaletteIcon,
    title: 'Brand Context Engine',
    description: 'Every output locked to client voice. Set brand context once and every piece of content stays on-brand.',
  },
  {
    icon: FileTextIcon,
    title: 'White-Label Reports',
    description: 'Professional PDFs your clients love. Export beautiful, branded reports with your agency logo and colors.',
  },
  {
    icon: PenToolIcon,
    title: 'Content Generation',
    description: 'Blogs, ads, social — all on-brand. Generate high-quality marketing content tailored to each client.',
  },
  {
    icon: UsersIcon,
    title: 'Team Collaboration',
    description: 'Roles, permissions, shared workspace. Invite your team with granular access controls and audit trails.',
  },
  {
    icon: LayoutDashboardIcon,
    title: 'Multi-Client Dashboard',
    description: 'Manage all clients from one view. Track audits, content, and reports across your entire portfolio.',
  },
]

function Features() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="features" className="bg-white py-24 lg:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="font-[family-name:var(--font-dm-sans)] text-sm font-semibold uppercase tracking-widest text-[#2563EB]">
            Everything Your Team Needs
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
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
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group rounded-2xl border border-zinc-200 bg-white p-8 transition-all duration-200 hover:-translate-y-1 hover:border-[#2563EB]/30 hover:shadow-xl hover:shadow-blue-500/5"
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB] transition-colors group-hover:bg-[#2563EB] group-hover:text-white">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-5 font-[family-name:var(--font-syne)] text-lg font-bold text-zinc-900">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        {feature.description}
      </p>
    </motion.div>
  )
}

export { Features }
