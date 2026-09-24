import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/Navbar'

export default async function NotFound() {
  // next-intl automatically picks the locale from the URL segment
  const t = await getTranslations('notFound')

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main id="main" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          {/* 404 display number */}
          <p style={{
            fontSize: 80,
            fontWeight: 590,
            letterSpacing: '-4px',
            lineHeight: 1,
            color: 'var(--border-strong)',
            marginBottom: 24,
            fontVariantNumeric: 'tabular-nums',
          }}>
            404
          </p>

          <h1 style={{ fontSize: 24, fontWeight: 510, letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: 12 }}>
            {t('title')}
          </h1>

          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
            {t('message')}
          </p>

          <Link
            href="/"
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
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            ← {t('backHome')}
          </Link>
        </div>
      </main>

      {/* The footer comes from the locale layout, which wraps this page too. */}
    </div>
  )
}
