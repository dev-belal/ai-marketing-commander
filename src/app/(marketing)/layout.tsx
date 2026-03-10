import { Syne, DM_Sans } from 'next/font/google'
import { ThemeProvider } from '@/contexts/theme-context'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${syne.variable} ${dmSans.variable} ${dmSans.className}`}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </div>
  )
}