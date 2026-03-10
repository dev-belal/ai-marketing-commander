'use client'

import { useEffect } from 'react'
import { Navbar } from '@/components/marketing/navbar'

declare global {
  interface Window {
    Cal?: ((...args: unknown[]) => void) & {
      loaded?: boolean
      ns?: Record<string, unknown>
      q?: unknown[]
    }
  }
}

const BENEFITS = [
  'Live walkthrough of the full platform',
  'Custom fit assessment for your agency',
  'Founding member pricing — only on this call',
]

function BookingPage() {
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark'

    const script = document.createElement('script')
    script.innerHTML = `
      (function (C, A, L) {
        let p = function (a, ar) { a.q.push(ar); };
        let d = C.document;
        C.Cal = C.Cal || function () {
          let cal = C.Cal; let ar = arguments;
          if (!cal.loaded) {
            cal.ns = {}; cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api = function () { p(api, arguments); };
            const namespace = ar[1];
            api.q = [];
            if (typeof namespace === "string") {
              cal.ns[namespace] = api;
              p(cal.ns[namespace], ar);
            } else { p(cal, ar); }
            return;
          }
          p(cal, ar);
        };
      })(window, "https://app.cal.com/embed/embed.js", "init");

      Cal("init", { origin: "https://app.cal.com" });

      Cal("inline", {
        elementOrSelector: "#cal-booking",
        calLink: "four-pie-labs/30min",
        layout: "month_view"
      });

      Cal("ui", {
        theme: "${currentTheme === 'light' ? 'light' : 'dark'}",
        styles: {
          branding: { brandColor: "${currentTheme === 'light' ? '#1D4ED8' : '#2563EB'}" }
        },
        hideEventTypeDetails: false,
        layout: "month_view"
      });
    `
    document.head.appendChild(script)
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // Sync Cal.com theme when data-theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme') || 'dark'
      if (window.Cal) {
        window.Cal('ui', {
          theme: theme === 'light' ? 'light' : 'dark',
          styles: {
            branding: {
              brandColor: theme === 'light' ? '#1D4ED8' : '#2563EB',
            },
          },
        })
      }
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="book-page" style={{ minHeight: '100vh', backgroundColor: '#080B14' }}>
      <Navbar />

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '100px 40px 80px',
          display: 'grid',
          gridTemplateColumns: '40% 1fr',
          gap: '60px',
        }}
        className="booking-layout"
      >
        {/* Left — Info */}
        <div className="book-left-col booking-left" style={{ position: 'sticky', top: '100px', alignSelf: 'start' }}>
          <span
            className="book-label"
            style={{
              fontSize: '11px',
              letterSpacing: '3px',
              color: '#2563EB',
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              marginBottom: '16px',
              display: 'block',
            }}
          >
            Free Consultation
          </span>

          <h1
            className="book-headline"
            style={{
              fontSize: 'clamp(28px, 3vw, 38px)',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '16px',
              fontFamily: 'var(--font-syne), Syne, sans-serif',
            }}
          >
            Let&apos;s talk about your agency&apos;s growth.
          </h1>

          <p
            className="book-subtext"
            style={{
              fontSize: '15px',
              color: '#94A3B8',
              lineHeight: 1.7,
              marginBottom: '32px',
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            }}
          >
            Book a 30-minute call to see how AI Marketing Commander can save your team 10+ hours
            per week.
          </p>

          {/* Benefits */}
          <div>
            {BENEFITS.map((item) => (
              <div
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '14px',
                }}
              >
                <span
                  className="book-benefit-icon"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(37,99,235,0.15)',
                    border: '1px solid rgba(37,99,235,0.4)',
                    color: '#60A5FA',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  &#10003;
                </span>
                <span
                  className="book-benefit-text"
                  style={{
                    fontSize: '14px',
                    color: '#CBD5E1',
                    lineHeight: 1.6,
                    fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            className="book-divider"
            style={{
              height: '1px',
              background: 'rgba(255,255,255,0.07)',
              margin: '28px 0',
            }}
          />

          {/* Who is this for */}
          <div>
            <p
              className="book-who-heading"
              style={{
                fontSize: '14px',
                color: '#ffffff',
                fontWeight: 600,
                marginBottom: '8px',
                fontFamily: 'var(--font-syne), Syne, sans-serif',
              }}
            >
              Who is this for?
            </p>
            <p
              className="book-who-text"
              style={{
                fontSize: '14px',
                color: '#6B7280',
                lineHeight: 1.6,
                fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
              }}
            >
              SEO agencies, marketing consultants, and in-house teams managing 3+ clients who want
              to deliver better results in less time.
            </p>
          </div>
        </div>

        {/* Right — Cal.com embed */}
        <div
          className="book-cal-wrapper"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            overflow: 'hidden',
            minHeight: '650px',
          }}
        >
          <div
            id="cal-booking"
            style={{ width: '100%', height: '100%', minHeight: '650px' }}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .booking-layout {
            grid-template-columns: 1fr !important;
            padding: 100px 20px 60px !important;
          }
          .booking-left {
            position: static !important;
          }
        }
      `}</style>
    </div>
  )
}

export { BookingPage }