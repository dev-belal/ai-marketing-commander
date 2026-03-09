'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const PLANS = [
  {
    name: 'Solo',
    description: 'For independent marketers',
    features: ['1 user', '5 clients', 'Basic audits', 'PDF exports'],
  },
  {
    name: 'Team',
    description: 'For growing agencies',
    features: ['Up to 10 users', '25 clients', 'Full audits', 'White-label reports'],
  },
  {
    name: 'Enterprise',
    description: 'For large agencies',
    features: ['Unlimited users', 'Unlimited clients', 'API access', 'Dedicated support'],
  },
]

function Pricing() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="pricing" className="bg-white py-24 lg:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
            Simple, transparent pricing — coming soon
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative overflow-hidden rounded-2xl border border-zinc-200 p-8"
            >
              {/* Blurred content */}
              <div className="select-none blur-[6px]">
                <p className="font-[family-name:var(--font-syne)] text-xl font-bold text-zinc-900">
                  {plan.name}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {plan.description}
                </p>
                <p className="mt-6 font-[family-name:var(--font-syne)] text-4xl font-bold text-zinc-900">
                  $??<span className="text-lg font-normal text-zinc-400">/mo</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-600">
                      <span className="size-1.5 rounded-full bg-[#2563EB]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coming Soon overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                }}
              >
                <span className="rounded-full border border-zinc-200 bg-white px-6 py-2 font-[family-name:var(--font-syne)] text-sm font-bold text-zinc-900 shadow-lg">
                  Coming Soon
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 text-center text-sm text-zinc-500"
        >
          Currently invite-only beta. Request access above.
        </motion.p>
      </div>
    </section>
  )
}

export { Pricing }
