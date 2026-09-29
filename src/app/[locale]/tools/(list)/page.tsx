import type { Metadata } from 'next'
import { Fragment } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getPayload } from '@/lib/payload'
import { Navbar } from '@/components/Navbar'
import { asLocale } from '@/i18n/routing'
import { logKindColors, toolStatusColors } from '@/lib/statusColors'
import { PLAYGROUND_LOG, prUrl, visibleLog } from '@/lib/playgroundLog'
import { formatDay, intlLocale } from '@/lib/formatDate'
import { localeAlternates } from '@/lib/alternates'
import { siteOpenGraph } from '@/lib/siteOpenGraph'

export const revalidate = 3600

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tools' })
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: localeAlternates(locale, '/tools'),
    openGraph: { ...(await siteOpenGraph(locale)), url: `${BASE}/${locale}/tools` },
  }
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
      ],
    },
    depth: 0,
    locale: asLocale(locale),
    limit: 50,
  })

  const LOG_KIND: Record<string, string> = {
    launch: t('log.kind.launch'),
    update: t('log.kind.update'),
    rename: t('log.kind.rename'),
  }
  // One object read, rather than t('log.entries.' + id), so the keys stay
  // statically analysable; playgroundLog.test.ts checks every id has words.
  const LOG_NOTES = t.raw('log.entries') as Record<string, string>
  const log = visibleLog(PLAYGROUND_LOG, tools)
  const listFormat = new Intl.ListFormat(intlLocale(locale), { type: 'conjunction' })

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
            🧪 {t('title')}
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
              const sc = toolStatusColors(tool.status)
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
                        color: sc.text,
                        background: sc.bg,
                        border: `1px solid ${sc.border}`,
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

        {log.length > 0 && (
          <section aria-labelledby="playground-log" style={{ marginTop: '72px' }}>
            <h2 id="playground-log" style={{
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              marginBottom: '8px',
            }}>
              {t('log.heading')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              {t('log.intro')}
            </p>
            <ol className="ds-log">
              {log.map(({ entry, tools: named }) => {
                const kc = logKindColors(entry.kind)
                // Tool names joined the way each language lists things
                // ("A, B, and C" / "A、B和C"), each one a link.
                const parts = listFormat.formatToParts(named.map((tool) => tool.slug ?? ''))
                return (
                  <li key={entry.id} className="ds-log-row">
                    <time dateTime={entry.date} className="ds-log-date">{formatDay(entry.date, locale)}</time>
                    <span className="ds-log-kind" style={{ color: kc.text, background: kc.bg, borderColor: kc.border }}>
                      {LOG_KIND[entry.kind]}
                    </span>
                    <div className="ds-log-body">
                      {named.length > 0 && (
                        <p className="ds-log-tools">
                          {parts.map((part, i) => {
                            if (part.type !== 'element') return <Fragment key={i}>{part.value}</Fragment>
                            const tool = named.find((n) => n.slug === part.value)!
                            return <Link key={i} href={`/tools/${tool.slug}`}>{tool.name}</Link>
                          })}
                        </p>
                      )}
                      <p className="ds-log-note">
                        {LOG_NOTES[entry.id]}{' '}
                        <a
                          href={prUrl(entry.pr)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t('log.prTitle', { pr: entry.pr })}
                          className="ds-log-pr"
                        >
                          #{entry.pr}
                        </a>
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        )}
      </main>
    </div>
  )
}
