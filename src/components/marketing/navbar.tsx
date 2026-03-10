'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { IconBolt, IconMenu2, IconX } from '@tabler/icons-react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
]

function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('dark')

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setCurrentTheme(document.documentElement.getAttribute('data-theme') || 'dark')
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    setCurrentTheme(document.documentElement.getAttribute('data-theme') || 'dark')
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith('#')) {
      e.preventDefault()
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      setMobileOpen(false)
    }
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="theme-transition fixed top-0 left-0 right-0 z-50 backdrop-blur-xl backdrop-saturate-[1.8] transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'var(--mk-bg-nav-scrolled)' : 'var(--mk-bg-nav)',
        borderBottom: scrolled ? '1px solid var(--mk-border)' : '1px solid transparent',
      }}
    >
      {/* Desktop: 3-column grid for centered links */}
      <div
        className="mx-auto hidden max-w-7xl px-6 py-4 md:grid"
        style={{ gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}
      >
        {/* Left — Logo */}
        <div style={{ justifySelf: 'start' }}>
          <Link href="/" className="flex items-center gap-1.5 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight">
            <IconBolt className="size-5 text-[#2563EB]" />
            <span style={{ color: 'var(--mk-text-primary)' }}>AI Marketing</span>
            <span className="text-[#2563EB]">Commander</span>
          </Link>
        </div>

        {/* Center — Nav Links */}
        <div className="flex items-center gap-8" style={{ justifySelf: 'center' }}>
          {NAV_LINKS.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, link.href)}
              className="nav-link text-[13px] font-medium tracking-wide transition-colors duration-150"
              style={{ color: 'var(--mk-nav-link)' }}
              whileHover="hovered"
              initial="initial"
            >
              {link.label}
              <motion.span
                variants={{
                  hovered: { scaleX: 1, opacity: 1 },
                  initial: { scaleX: 0, opacity: 0 },
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  display: 'block',
                  height: '2px',
                  background: '#2563EB',
                  borderRadius: '1px',
                  originX: 0,
                  marginTop: '2px',
                }}
              />
            </motion.a>
          ))}
        </div>

        {/* Right — CTA Button + Theme Toggle */}
        <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/signup"
            className="nav-request-btn group relative rounded-lg px-5 py-2 text-[13px] font-semibold tracking-wide text-white transition-all duration-200"
          >
            <span className="nav-btn-gradient-border absolute inset-0 rounded-lg border border-transparent bg-gradient-to-r from-[#2563EB] to-[#06B6D4] opacity-100" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: '1px' }} />
            <span className="nav-btn-gradient-fill absolute inset-0 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#06B6D4] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <span className="relative">Request Access</span>
          </Link>
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            className="nav-theme-btn flex size-9 items-center justify-center rounded-full transition-all duration-200"
            style={{
              background: currentTheme === 'dark' ? 'rgba(255,255,255,0.08)' : '#ffffff',
              border: currentTheme === 'dark' ? '1px solid rgba(255,255,255,0.15)' : '1px solid #DBEAFE',
            }}
            onMouseEnter={(e) => {
              if (currentTheme === 'dark') {
                e.currentTarget.style.background = 'rgba(37,99,235,0.2)'
                e.currentTarget.style.borderColor = 'rgba(37,99,235,0.5)'
              } else {
                e.currentTarget.style.background = '#EFF6FF'
                e.currentTarget.style.borderColor = '#2563EB'
              }
            }}
            onMouseLeave={(e) => {
              if (currentTheme === 'dark') {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
              } else {
                e.currentTarget.style.background = '#ffffff'
                e.currentTarget.style.borderColor = '#DBEAFE'
              }
            }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <AnimatePresence mode="wait">
              {currentTheme === 'dark' ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="size-4 text-yellow-400" strokeWidth={1.5} />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="size-4 text-[#334155]" strokeWidth={1.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile: flex with space-between */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:hidden">
        <Link href="/" className="flex items-center gap-1.5 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight">
          <IconBolt className="size-5 text-[#2563EB]" />
          <span style={{ color: 'var(--mk-text-primary)' }}>AI Marketing</span>
          <span className="text-[#2563EB]">Commander</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: 'var(--mk-text-primary)' }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <IconX className="size-6" /> : <IconMenu2 className="size-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden backdrop-blur-xl md:hidden"
            style={{
              borderTop: '1px solid var(--mk-border)',
              backgroundColor: 'var(--mk-bg-nav-scrolled)',
            }}
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-[13px] font-medium tracking-wide transition-colors"
                  style={{ color: 'var(--mk-nav-link)' }}
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/signup"
                className="rounded-lg bg-gradient-to-r from-[#2563EB] to-[#06B6D4] px-5 py-2.5 text-center text-[13px] font-semibold tracking-wide text-white"
                onClick={() => setMobileOpen(false)}
              >
                Request Access
              </Link>
              <button
                onClick={toggleTheme}
                className="nav-theme-btn flex items-center gap-2 text-[13px] font-medium tracking-wide transition-colors"
                style={{ color: 'var(--mk-nav-link)' }}
              >
                {currentTheme === 'dark' ? (
                  <Sun className="size-4 text-yellow-400" strokeWidth={1.5} />
                ) : (
                  <Moon className="size-4 text-[#334155]" strokeWidth={1.5} />
                )}
                {currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export { Navbar }