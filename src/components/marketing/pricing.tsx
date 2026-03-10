'use client'

import { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion, useInView } from 'framer-motion'

const Section3DBg = dynamic(() => import('@/components/landing/section-3d-bg'), {
  ssr: false,
})

const PLANS = [
  {
    name: 'Solo',
    description: 'For freelancers & consultants',
    features: ['1 user', '5 clients', 'Basic audits', 'PDF exports'],
    highlighted: false,
  },
  {
    name: 'Team',
    description: 'For growing agencies',
    features: ['Up to 10 users', '25 clients', 'Full audits', 'White-label reports', 'Priority support'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    description: 'For large agencies',
    features: ['Unlimited users', 'Unlimited clients', 'API access', 'Dedicated support', 'Custom integrations'],
    highlighted: false,
  },
]

function Pricing() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMouse({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    })
  }, [])

  return (
    <section
      id="pricing"
      onMouseMove={handleMouseMove}
      style={{ position: 'relative', overflow: 'hidden' }}
      className="pricing-section theme-transition bg-[#080B14] py-24 lg:py-32"
    >
      {/* Top separator */}
      <div
        className="pricing-separator absolute left-0 right-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', zIndex: 2 }}
      />

      {/* 3D particle background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Section3DBg
          nodeCount={35}
          nodeColor1="#1E3A8A"
          nodeColor2="#164E63"
          opacity={0.5}
          mouseX={mouse.x}
          mouseY={mouse.y}
        />
      </div>

      {/* Radial gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(37,99,235,0.08) 0%, transparent 70%)',
          zIndex: 1,
        }}
      />
      {/* Subtle grid lines */}
      <div
        className="pricing-grid-lines pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          zIndex: 1,
        }}
      />

      <div ref={ref} style={{ position: 'relative', zIndex: 1 }} className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="pricing-headline font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[48px]">
            Simple pricing — coming soon
          </h2>
          <p className="pricing-subtext mt-4 font-[family-name:var(--font-dm-sans)] text-lg text-[#94A3B8]">
            Currently invite-only beta. Lock in founding member rates.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`flex flex-col overflow-hidden rounded-[20px] border p-9 backdrop-blur-[10px] ${
                plan.highlighted
                  ? 'pricing-card-highlight border-[#2563EB]/30 bg-white/[0.04] shadow-[0_0_40px_rgba(37,99,235,0.08)]'
                  : 'pricing-card border-white/[0.08] bg-white/[0.03]'
              } ${plan.highlighted ? 'sm:-my-4 sm:py-12' : ''}`}
            >
              {/* Blurred content */}
              <div className="pointer-events-none flex-1 select-none blur-[4px]">
                <p className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
                  {plan.name}
                </p>
                <p className="mt-1 font-[family-name:var(--font-dm-sans)] text-sm text-[#94A3B8]">
                  {plan.description}
                </p>
                <p className="mt-6 font-[family-name:var(--font-syne)] text-4xl font-bold text-white">
                  $??<span className="text-lg font-normal text-[#64748B]">/mo</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm text-[#94A3B8]">
                      <span className="size-1.5 rounded-full bg-[#2563EB]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coming Soon badge — bottom of card */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  marginTop: 'auto',
                  paddingTop: '24px',
                }}
              >
                <span
                  className="rounded-full border border-[#2563EB]/30 bg-[#2563EB]/15 font-[family-name:var(--font-syne)] text-sm font-semibold text-[#93C5FD]"
                  style={{
                    display: 'inline-block',
                    width: 'auto',
                    maxWidth: '160px',
                    textAlign: 'center',
                    padding: '6px 16px',
                  }}
                >
                  Coming Soon
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mx-auto mt-12 flex w-full max-w-7xl flex-col items-center gap-4 text-center"
        >
          <p className="font-[family-name:var(--font-dm-sans)] text-[15px] text-[#94A3B8]">
            Beta users get lifetime founding member pricing.
          </p>
          <Link
            href="/signup"
            className="font-[family-name:var(--font-syne)] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
            style={{
              display: 'block',
              width: 'auto',
              maxWidth: '260px',
              marginLeft: 'auto',
              marginRight: 'auto',
              padding: '14px 40px',
              background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
              color: 'white',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '15px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Request Beta Access
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

export { Pricing }