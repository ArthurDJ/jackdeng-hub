import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getPayload } from '@/lib/payload'
import { Navbar } from '@/components/Navbar'
import { asLocale } from '@/i18n/routing'

export const revalidate = 3600

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tools' })
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: `${BASE}/${locale}/tools`,
      languages: { en: `${BASE}/en/tools`, zh: `${BASE}/zh/tools` },
    },
  }
}

const STATUS_COLOR: Record<string, string> = {
  online:      '#10b981',
  offline:     '#71717a',
  maintenance: '#f59e0b',
}

export default async function ToolsPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tools' })

  // Static map — next-intl keys must stay statically analysable (no t('status.' + x))
  const STATUS_LABEL: Record<string, string> = {
    online: t('status.online'),
    offline: t('status.offline'),
    maintenance: t('status.maintenance'),
  }

  const payload = await getPayload()
  const { docs: tools } = await payload.find({
    collection: 'tools',
    where: {
      and: [
        { status: { equals: 'online' } },
        { accessControl: { equals: 'public' } },
        { toolType: { equals: 'interactive' } },
      ],
    },
    depth: 0,
    locale: asLocale(locale),
    limit: 50,
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Navbar />

      <main id="main" className="ds-container" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '12px',
          }}>
            🛠️ {t('title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            {t('subtitle')}
          </p>
        </div>

        {/* Grid */}
        {tools.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)' }}>
            {t('noTools')}
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {tools.map((tool) => {
              const color = STATUS_COLOR[tool.status] ?? STATUS_COLOR.online
              const label = STATUS_LABEL[tool.status] ?? STATUS_LABEL.online
              return (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="ds-card-hover"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '12px',
                      padding: '24px',
                      cursor: 'pointer',
                      height: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontSize: '32px' }}>{tool.icon ?? '🔧'}</span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: color,
                        background: color + '18',
                        border: `1px solid ${color}30`,
                        borderRadius: '4px',
                        padding: '2px 8px',
                      }}>
                        {label}
                      </span>
                    </div>
                    <h2 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                      letterSpacing: '-0.01em',
                    }}>
                      {tool.name}
                    </h2>
                    {tool.description && (
                      <p style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {tool.description}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
