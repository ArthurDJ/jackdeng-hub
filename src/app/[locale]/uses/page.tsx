import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/Navbar'
import { getPayload } from '@/lib/payload'
import { asLocale } from '@/i18n/routing'
import { localeAlternates } from '@/lib/alternates'
import { siteOpenGraph } from '@/lib/siteOpenGraph'
import { BUILT_HERE, USES } from '@/lib/uses'

export const revalidate = 3600

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'uses' })
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: localeAlternates(locale, '/uses'),
    openGraph: { ...(await siteOpenGraph(locale)), url: `${BASE}/${locale}/uses` },
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 11, fontWeight: 510, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14 }}>
      {children}
    </h2>
  )
}

export default async function UsesPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'uses' })
  const GROUPS = t.raw('groups') as Record<string, string>
  const NOTES = t.raw('items') as Record<string, string>

  // The utilities I built, from their records so the names follow /admin and
  // a tool that is not public yet is simply left out — the same filter as
  // the /tools list, so this page never links to a 404.
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'tools',
    where: {
      and: [
        { slug: { in: BUILT_HERE } },
        { status: { equals: 'online' } },
        { accessControl: { equals: 'public' } },
      ],
    },
    depth: 0,
    locale: asLocale(locale),
    limit: BUILT_HERE.length,
  })
  const built = BUILT_HERE.flatMap((slug) => docs.filter((d) => d.slug === slug))

  const card: React.CSSProperties = {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-default)',
    borderRadius: 12,
    padding: '16px 18px',
    height: '100%',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Navbar />

      <main id="main" className="ds-container" style={{ paddingTop: '64px', paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: 48 }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '12px',
          }}>
            🧰 {t('title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: 640, lineHeight: 1.6 }}>
            {t('subtitle')}
          </p>
        </div>

        {built.length > 0 && (
          <section>
            <SectionLabel>{t('builtHeading')}</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {built.map((tool) => (
                <Link key={tool.id} href={`/tools/${tool.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="ds-card-hover" style={card}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                      <span aria-hidden="true" style={{ marginRight: 8 }}>{tool.icon ?? '🔧'}</span>
                      {tool.name}
                    </p>
                    {tool.description && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{tool.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {USES.map((group) => (
          <section key={group.id}>
            <SectionLabel>{GROUPS[group.id]}</SectionLabel>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {group.items.map((item) => (
                <li key={item.id}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div className="ds-card-hover" style={card}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                        {item.name}
                        <span aria-hidden="true" style={{ marginLeft: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>↗</span>
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{NOTES[item.id]}</p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{t('footnote')}</p>
      </main>
    </div>
  )
}
