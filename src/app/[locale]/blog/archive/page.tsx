import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getPayload } from '@/lib/payload'
import { Sidebar } from '@/components/Sidebar'
import { buildSidebarData } from '@/lib/sidebarData'

export const revalidate = 3600

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ year?: string; month?: string }>
}

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })
  return {
    title: `${t('archive')} — Jack Deng`,
    description: 'All blog posts organized by year and month.',
  }
}

export default async function ArchivePage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale, namespace: 'blog' })

  const filterYear = sp.year ? parseInt(sp.year, 10) : null
  const filterMonth = sp.month ? parseInt(sp.month, 10) : null

  const payload = await getPayload()

  const { docs: all } = await payload.find({
    collection: 'blogs',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    depth: 0,
    limit: 1000,
  })

  const sidebar = await buildSidebarData()

  // Group by year → month → posts
  const grouped: Record<number, Record<number, any[]>> = {}
  for (const blog of all as any[]) {
    if (!blog.publishedAt) continue
    const d = new Date(blog.publishedAt)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    if (!grouped[y]) grouped[y] = {}
    if (!grouped[y][m]) grouped[y][m] = []
    grouped[y][m].push(blog)
  }

  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a)
  const displayYears = filterYear ? [filterYear] : years
  const totalCount = (all as any[]).length

  return (
    <main>
      {/* Header */}
      <section style={{ borderBottom: '1px solid var(--border-subtle)', padding: '48px 24px 40px' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 590, letterSpacing: '-0.8px', color: 'var(--text-primary)', marginBottom: 8 }}>
            {t('archive')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
            {totalCount} {totalCount !== 1 ? t('posts') : t('post')}
          </p>
          {(filterYear || filterMonth) && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Showing:</span>
              <span style={{ fontWeight: 510, color: 'var(--text-primary)' }}>
                {filterMonth ? MONTHS[filterMonth - 1] : ''}{' '}{filterYear ?? ''}
              </span>
              <Link href="/blog/archive" style={{ color: 'var(--accent-primary)', marginLeft: 8, textDecoration: 'none' }}>
                ✕ Clear
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }} className="blog-layout">
          <style>{`@media (min-width: 1024px) { .blog-layout { grid-template-columns: 1fr 260px !important; } }`}</style>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {displayYears.map((year) => {
              const monthsInYear = Object.keys(grouped[year] ?? {})
                .map(Number)
                .filter((m) => !filterMonth || m === filterMonth)
                .sort((a, b) => b - a)

              if (monthsInYear.length === 0) return null

              return (
                <section key={year}>
                  <h2 style={{
                    fontSize: 20, fontWeight: 590, letterSpacing: '-0.3px',
                    color: 'var(--text-primary)', marginBottom: 20, paddingBottom: 12,
                    borderBottom: '1px solid var(--border-subtle)',
                  }}>
                    {year}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {monthsInYear.map((month) => {
                      const posts = grouped[year][month]
                      return (
                        <div key={month}>
                          <Link
                            href={`/blog/archive?year=${year}&month=${month}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                              letterSpacing: '0.08em', color: 'var(--text-tertiary)',
                              textDecoration: 'none', marginBottom: 10,
                            }}
                            className="ds-link-hover"
                          >
                            {MONTHS[month - 1]}
                            <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11, letterSpacing: 0 }}>
                              ({posts.length})
                            </span>
                          </Link>
                          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 4, listStyle: 'none', margin: 0 }}>
                            {posts.map((blog: any) => (
                              <li key={blog.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <time style={{ fontSize: 12, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums', paddingTop: 2, width: 90, flexShrink: 0 }}>
                                  {formatDate(blog.publishedAt, locale)}
                                </time>
                                <Link
                                  href={`/blog/${blog.slug}`}
                                  style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', lineHeight: 1.5 }}
                                  className="ds-link-hover"
                                >
                                  {blog.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
            {years.length === 0 && (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '48px 0', fontSize: 15 }}>
                {t('noPostsFound')}
              </p>
            )}
          </div>

          <Sidebar {...sidebar} />
        </div>
      </div>
    </main>
  )
}
