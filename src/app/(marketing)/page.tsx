import type { Metadata } from 'next'
import { Navbar } from '@/components/marketing/navbar'
import { Hero } from '@/components/marketing/hero'
import { Features } from '@/components/marketing/features'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { Pricing } from '@/components/marketing/pricing'
import { FAQ } from '@/components/marketing/faq'
import { Footer } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'AI Marketing Commander — Your Entire Marketing Team, Powered by AI',
  description:
    'AI Marketing Commander gives SEO and marketing teams superpowers — audit clients, generate content, and deliver white-label reports in minutes, not days.',
}

export default function MarketingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <Footer />
    </>
  )
}
