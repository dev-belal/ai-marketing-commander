'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconSun, IconMoon } from '@tabler/icons-react'
import { useTheme } from '@/contexts/theme-context'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [currentTheme, setCurrentTheme] = useState('dark')

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setCurrentTheme(
        document.documentElement.getAttribute('data-theme') || 'dark'
      )
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    setCurrentTheme(
      document.documentElement.getAttribute('data-theme') || 'dark'
    )
    return () => observer.disconnect()
  }, [])

  const isDark = currentTheme === 'dark'

  return (
    <motion.button
      onClick={toggleTheme}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.3 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-[999] flex size-12 items-center justify-center rounded-full transition-all duration-300"
      style={{
        background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
        border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #DBEAFE',
        boxShadow: isDark ? 'none' : '0 4px 16px rgba(37,99,235,0.12)',
      }}
      onMouseEnter={(e) => {
        if (isDark) {
          e.currentTarget.style.background = 'rgba(37,99,235,0.2)'
          e.currentTarget.style.border = '1px solid rgba(37,99,235,0.5)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(37,99,235,0.4), 0 0 40px rgba(37,99,235,0.15)'
        } else {
          e.currentTarget.style.background = '#EFF6FF'
          e.currentTarget.style.border = '1px solid #2563EB'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(37,99,235,0.25), 0 4px 16px rgba(37,99,235,0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (isDark) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.border = '1px solid rgba(255,255,255,0.15)'
          e.currentTarget.style.boxShadow = 'none'
        } else {
          e.currentTarget.style.background = '#ffffff'
          e.currentTarget.style.border = '1px solid #DBEAFE'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.12)'
        }
      }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <IconSun className="size-5 text-yellow-400" stroke={1.5} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <IconMoon className="size-5 text-[#334155]" stroke={1.5} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export { ThemeToggle }