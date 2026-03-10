'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { IconPlus, IconMinus } from '@tabler/icons-react'

const FAQ_ITEMS = [
  {
    q: 'Who is AI Marketing Commander for?',
    a: "Marketing agencies, SEO consultants, and in-house marketing teams managing multiple clients. If you spend hours on audits and reports — this is for you.",
  },
  {
    q: 'How does beta access work?',
    a: "Submit a request with your name, company, and use case. We review within 24 hours and send a personal invite link if it's a good fit.",
  },
  {
    q: 'What AI powers the platform?',
    a: 'We use frontier AI models to power audits, content generation, and quality checks. Every output is validated and human-readable.',
  },
  {
    q: 'Can I white-label reports with my logo?',
    a: "Yes. Every PDF report uses your agency's logo and branding. Clients see your agency — not our platform.",
  },
  {
    q: 'How many clients can I manage?',
    a: 'Beta accounts have no hard limits. We want to understand real usage before setting plan limits.',
  },
  {
    q: 'When will pricing be available?',
    a: 'Pricing launches with our public release. Beta users lock in founding member rates — significantly lower than public pricing.',
  },
]

function FAQ() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const leftCol = FAQ_ITEMS.slice(0, 3)
  const rightCol = FAQ_ITEMS.slice(3)

  return (
    <section
      id="faq"
      className="theme-transition relative py-24 lg:py-32"
      style={{ backgroundColor: 'var(--mk-faq-bg)' }}
    >
      {/* Top separator */}
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--mk-faq-border), transparent)' }}
      />
      {/* Top border */}
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{ borderTop: '1px solid var(--mk-faq-border)' }}
      />
      {/* Left blue glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 40% 80% at 0% 50%, rgba(37,99,235,0.06) 0%, transparent 60%)',
        }}
      />

      <div ref={ref} className="relative mx-auto max-w-5xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2
            className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[48px]"
            style={{ color: 'var(--mk-faq-heading)' }}
          >
            Common questions
          </h2>
          <p
            className="mt-4 font-[family-name:var(--font-dm-sans)] text-lg"
            style={{ color: 'var(--mk-faq-subtext)' }}
          >
            Everything you need to know before requesting access.
          </p>
        </motion.div>

        {/* Two columns */}
        <div className="mt-16 grid gap-0 lg:grid-cols-2 lg:gap-12">
          <div>
            {leftCol.map((item, i) => (
              <FAQItem
                key={i}
                question={item.q}
                answer={item.a}
                index={i}
                inView={inView}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
          <div>
            {rightCol.map((item, i) => {
              const globalIndex = i + 3
              return (
                <FAQItem
                  key={globalIndex}
                  question={item.q}
                  answer={item.a}
                  index={globalIndex}
                  inView={inView}
                  isOpen={openIndex === globalIndex}
                  onToggle={() => setOpenIndex(openIndex === globalIndex ? null : globalIndex)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function FAQItem({
  question,
  answer,
  index,
  inView,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  index: number
  inView: boolean
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      style={{ borderBottom: '1px solid var(--mk-faq-border)' }}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors duration-150"
      >
        <span
          className="font-[family-name:var(--font-syne)] text-[16px] font-semibold"
          style={{ color: 'var(--mk-faq-question)' }}
        >
          {question}
        </span>
        <span className="shrink-0" style={{ color: 'var(--mk-faq-icon)' }}>
          {isOpen ? <IconMinus className="size-4" /> : <IconPlus className="size-4" />}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p
              className="pb-5 font-[family-name:var(--font-dm-sans)] text-[15px] leading-relaxed"
              style={{ color: 'var(--mk-faq-answer)' }}
            >
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export { FAQ }