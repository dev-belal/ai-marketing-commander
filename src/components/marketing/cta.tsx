'use client'

import { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion, useInView } from 'framer-motion'

const Section3DBg = dynamic(() => import('@/components/landing/section-3d-bg'), {
  ssr: false,
})

function CTA() {
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
      onMouseMove={handleMouseMove}
      style={{ position: 'relative', overflow: 'hidden' }}
      className="cta-section theme-transition bg-[#080B14] py-24 lg:py-32"
    >
      {/* Top separator */}
      <div
        className="cta-separator absolute left-0 right-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', zIndex: 2 }}
      />

      {/* 3D particle background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Section3DBg
          nodeCount={25}
          nodeColor1="#1D4ED8"
          nodeColor2="#0EA5E9"
          opacity={0.7}
          mouseX={mouse.x}
          mouseY={mouse.y}
        />
      </div>

      <div ref={ref} style={{ position: 'relative', zIndex: 1 }} className="mx-auto max-w-4xl px-6">
        {/* Radial glow behind card */}
        <div
          className="pointer-events-none absolute"
          style={{
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
        />

        {/* Animated background orb */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'rgba(37,99,235,0.08)',
            filter: 'blur(80px)',
            zIndex: 1,
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="cta-card relative overflow-hidden rounded-3xl px-8 py-20 text-center sm:px-16"
          style={{
            border: '1px solid rgba(37,99,235,0.25)',
            background: 'rgba(37,99,235,0.04)',
            zIndex: 2,
          }}
        >
          {/* Background gradient orb inside card */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute left-1/2 top-1/2 size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[100px]"
              style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 70%)' }}
            />
          </div>

          <div className="relative z-10">
            <p
              className="cta-eyebrow font-[family-name:var(--font-syne)] font-semibold uppercase"
              style={{ fontSize: '11px', letterSpacing: '3px', color: '#2563EB' }}
            >
              Ready to Get Started?
            </p>
            <h2
              className="cta-headline mt-5 font-[family-name:var(--font-syne)] tracking-tight text-white"
              style={{
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                fontWeight: 700,
                lineHeight: 1.2,
                maxWidth: '600px',
                margin: '20px auto 0',
                textAlign: 'center',
              }}
            >
              Give your agency AI superpowers.
            </h2>
            <p
              className="cta-subtext mt-4 font-[family-name:var(--font-dm-sans)]"
              style={{ fontSize: '16px', color: '#94A3B8' }}
            >
              Join the beta. Limited spots available.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <motion.div whileHover="hovered" variants={{ hovered: { scale: 1.02 } }}>
                <Link
                  href="/signup"
                  className="cta-primary-btn inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#2563EB] to-[#06B6D4] px-7 py-3.5 font-[family-name:var(--font-syne)] text-[15px] font-semibold text-white transition-shadow duration-200"
                  style={{ boxShadow: '0 4px 15px rgba(37,99,235,0.25)' }}
                >
                  Request Early Access
                  <motion.span
                    variants={{ hovered: { x: 5 } }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{ display: 'inline-block', marginLeft: '6px' }}
                  >
                    &rarr;
                  </motion.span>
                </Link>
              </motion.div>
              <motion.div whileHover="hovered" variants={{ hovered: { scale: 1.02 } }}>
                <Link
                  href="/book"
                  className="cta-secondary-btn inline-flex items-center justify-center rounded-lg border border-white/15 px-7 py-3.5 font-[family-name:var(--font-dm-sans)] text-[15px] font-medium text-zinc-300 transition-all duration-200 hover:border-white/30 hover:bg-white/5 hover:text-white"
                >
                  Book a Free Consultation
                  <motion.span
                    variants={{ hovered: { x: 5 } }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{ display: 'inline-block', marginLeft: '6px' }}
                  >
                    &rarr;
                  </motion.span>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export { CTA }