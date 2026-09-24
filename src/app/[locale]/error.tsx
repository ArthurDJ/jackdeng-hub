'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/Navbar'

/**
 * Locale-scoped error boundary.
 *
 * Without this file a thrown error anywhere under /[locale] falls through to
 * Next's unstyled default — a bare "Application error" on a white page, which
 * is the worst thing a portfolio site can show a visitor. DEPLOY_ISSUES.md
 * records a long run of production 500s, so this is not hypothetical.
 *
 * Deliberately shows `digest` and never `error.message`: Next redacts server
 * error messages in production, but client-side errors carry theirs through,
 * and those can name internals. The digest is a hash that matches the
 * server-side log entry, which is what actually helps when debugging.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('error')
  const tNotFound = useTranslations('notFound')

  useEffect(() => {
    // Surfaces in the browser console and, on Vercel, in the function logs.
    console.error('[route error]', error.digest ?? '(no digest)', error)
  }, [error])

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar />

      <main id="main"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
          <p
            style={{
              fontSize: 80,
              fontWeight: 590,
              letterSpacing: '-4px',
              lineHeight: 1,
              color: 'var(--border-strong)',
              marginBottom: 24,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            500
          </p>

          <h1
            style={{
              fontSize: 24,
              fontWeight: 510,
              letterSpacing: '-0.3px',
              color: 'var(--text-primary)',
              marginBottom: 12,
            }}
          >
            {t('title')}
          </h1>

          <p
            style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            {t('message')}
          </p>

          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={reset}
              className="ds-accent-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 9999,
                background: 'var(--accent-solid)',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 510,
                border: '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              {t('retry')}
            </button>

            <Link
              href="/"
              className="ds-ghost-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 9999,
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: 14,
                fontWeight: 510,
                textDecoration: 'none',
              }}
            >
              ← {tNotFound('backHome')}
            </Link>
          </div>

          {error.digest && (
            <p
              style={{
                marginTop: 28,
                fontSize: 12,
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
              }}
            >
              {t('reference')}: {error.digest}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
