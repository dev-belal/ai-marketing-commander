'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon } from 'lucide-react'

const FAQ_ITEMS = [
  {
    q: 'Who is AI Marketing Commander for?',
    a: 'AI Marketing Commander is built for SEO and marketing agencies managing multiple clients. Whether you\'re a solo consultant or a 25-person team, the platform scales to your workflow.',
  },
  {
    q: 'How does the beta access work?',
    a: 'During our beta phase, access is invite-only. Submit a request through our signup page and our team will review your application. Approved users get full access to all features at no cost during the beta period.',
  },
  {
    q: 'What AI model powers the platform?',
    a: 'We use Anthropic\'s Claude — specifically the latest Sonnet model — for all AI-powered features including marketing audits, content generation, and brand analysis. This ensures high-quality, nuanced outputs.',
  },
  {
    q: 'Can I white-label reports with my agency logo?',
    a: 'Absolutely. Upload your agency logo and set your brand colors. Every PDF report is generated with your branding — your clients never see ours. We even auto-remove logo backgrounds for a polished look.',
  },
  {
    q: 'How many clients can I manage?',
    a: 'During the beta, there are no hard limits on client count. Each client gets their own workspace with brand context, audits, content, and reports — all organized under your agency dashboard.',
  },
  {
    q: 'When will pricing be available?',
    a: 'We\'re finalizing our pricing tiers and will announce them before the beta concludes. Beta users will receive early-adopter pricing and be grandfathered into favorable terms.',
  },
]

function FAQ() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="faq" className="bg-[#080B14] py-24 lg:py-32">
      <div ref={ref} className="mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Common questions
          </h2>
        </motion.div>

        <div className="mt-16 space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={i} question={item.q} answer={item.a} index={i} inView={inView} />
          ))}
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
}: {
  question: string
  answer: string
  index: number
  inView: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="rounded-xl border border-white/10 bg-white/5"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-[family-name:var(--font-dm-sans)] text-sm font-medium text-white">
          {question}
        </span>
        <ChevronDownIcon
          className={`size-5 shrink-0 text-zinc-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-zinc-400">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export { FAQ }
