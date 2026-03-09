import Link from 'next/link'

const FOOTER_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Request Access', href: '/signup' },
]

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080B14] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo + tagline */}
          <div>
            <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
              AI Marketing Commander
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Marketing intelligence, amplified.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-[family-name:var(--font-dm-sans)] text-sm text-zinc-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Credit */}
          <p className="font-[family-name:var(--font-dm-sans)] text-sm text-zinc-500">
            Built by 4Pie Labs
          </p>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6 text-center">
          <p className="font-[family-name:var(--font-dm-sans)] text-xs text-zinc-600">
            &copy; 2026 AI Marketing Commander. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
