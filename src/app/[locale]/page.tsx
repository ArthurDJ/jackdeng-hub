import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { BlogCard } from '@/components/BlogCard'
import { HomeProjectCard } from '@/components/HomeProjectCard'
import { getPayload } from '@/lib/payload'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  return {
    title: t('title'),
    description: 'Senior Software Engineer | Backend & Data Systems. NetSuite · Boomi · Supabase · Next.js.',
    alternates: {
      canonical: `${BASE}/${locale}`,
      languages: { en: `${BASE}/en`, zh: `${BASE}/zh` },
    },
  }
}

/* ─── Tech Stack data (static) ──────────────────────────────────────────── */
const TECH_STACK = [
  {
    name: 'NetSuite',
    description: 'ERP & financial data governance',
    color: '#0077B6',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className="w-8 h-8">
        <rect width="40" height="40" rx="8" fill="#0077B6" fillOpacity="0.15"/>
        <text x="20" y="26" textAnchor="middle" fontSize="13" fontWeight="700"
          fill="#0077B6" fontFamily="system-ui,sans-serif">NS</text>
      </svg>
    ),
  },
  {
    name: 'Boomi',
    description: 'iPaaS integration & workflow automation',
    color: '#00AAFF',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className="w-8 h-8">
        <rect width="40" height="40" rx="8" fill="#00AAFF" fillOpacity="0.12"/>
        <circle cx="20" cy="20" r="7" stroke="#00AAFF" strokeWidth="2.5" fill="none"/>
        <circle cx="20" cy="20" r="3" fill="#00AAFF"/>
      </svg>
    ),
  },
  {
    name: 'Supabase',
    description: 'Postgres-native backend & auth',
    color: '#3ECF8E',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className="w-8 h-8">
        <rect width="40" height="40" rx="8" fill="#3ECF8E" fillOpacity="0.12"/>
        <path d="M22 10L13 22h8l-3 8 10-13h-8l3-7z" fill="#3ECF8E" stroke="#3ECF8E" strokeWidth="0.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    name: 'Next.js',
    description: 'Full-stack React for internal tools',
    color: '#f7f8f8',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className="w-8 h-8">
        <rect width="40" height="40" rx="8" fill="rgba(247,248,248,0.08)"/>
        <text x="20" y="26" textAnchor="middle" fontSize="14" fontWeight="700"
          fill="currentColor" fontFamily="system-ui,sans-serif">N</text>
      </svg>
    ),
  },
]

/* ─── Page component ──────────────────────────────────────────────────────── */
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })

  const payload = await getPayload()

  // blogs_locales table may not exist yet (run: npx payload migrate)
  // Fall back to empty array rather than crashing the page
  const [blogsResult, projectsResult] = await Promise.all([
    payload.find({
      collection: 'blogs',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 1,
      limit: 3,
      locale: locale as any,
    }).catch(() => ({ docs: [] })),
    payload.find({
      collection: 'projects',
      where: { isPinned: { equals: true } },
      sort: '-createdAt',
      depth: 1,
      limit: 4,
    }).catch(() => ({ docs: [] })),
  ])

  const blogs = blogsResult.docs as any[]
  const projects = projectsResult.docs as any[]

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }} className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 sm:pt-24 sm:pb-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">

            {/* ── Left: text ──────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Status pill */}
              <div className="inline-flex items-center gap-2 mb-6 sm:mb-8"
                style={{
                  background: 'rgba(16,185,129,0.10)',
                  border: '1px solid rgba(16,185,129,0.20)',
                  borderRadius: 9999,
                  padding: '4px 14px',
                }}>
                <span
                  className="animate-pulse"
                  style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}
                />
                <span style={{ fontSize: 13, fontWeight: 510, color: '#10b981' }}>
                  {t('available')}
                </span>
              </div>

              {/* Title */}
              <h1
                className="mb-5"
                style={{
                  fontSize: 'clamp(32px, 4.5vw, 52px)',
                  fontWeight: 590,
                  letterSpacing: '-1.2px',
                  lineHeight: 1.05,
                  color: 'var(--text-primary)',
                }}
              >
                {t('title')}
              </h1>

              {/* Subtitle — single line, no bio paragraph */}
              <p
                className="mb-10"
                style={{
                  fontSize: 18,
                  fontWeight: 350,
                  color: 'var(--text-secondary)',
                  letterSpacing: '-0.2px',
                  lineHeight: 1.6,
                  maxWidth: 480,
                }}
              >
                {t('subtitle')}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <Link
                  href={`/${locale}/projects`}
                  className="ds-accent-btn w-full sm:w-auto text-center justify-center"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 24px',
                    borderRadius: 9999,
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  {t('ctaProjects')}
                </Link>
                <Link
                  href="/about"
                  className="ds-ghost-btn w-full sm:w-auto text-center justify-center"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 24px',
                    borderRadius: 9999,
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  {t('ctaAbout')}
                </Link>
              </div>
            </div>

            {/* ── Right: floating project preview cards ───────────────── */}
            {projects.length > 0 && (
              <div className="hidden lg:flex flex-col gap-3 flex-shrink-0 w-72 relative pt-4">
                {projects.slice(0, 2).map((project: any, i: number) => {
                  const techStack: string[] = (project.techStack ?? []).map((ts: any) => ts.tech).filter(Boolean)
                  const statusBg: Record<string, string> = {
                    active:    'rgba(16,185,129,0.10)',
                    completed: 'rgba(94,106,210,0.10)',
                    'on-hold': 'rgba(245,158,11,0.10)',
                  }
                  const statusText: Record<string, string> = {
                    active:    '#10b981',
                    completed: '#7170ff',
                    'on-hold': '#f59e0b',
                  }
                  const statusBorder: Record<string, string> = {
                    active:    'rgba(16,185,129,0.20)',
                    completed: 'rgba(94,106,210,0.20)',
                    'on-hold': 'rgba(245,158,11,0.20)',
                  }
                  return (
                    <div
                      key={project.id}
                      style={{
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                        transform: i === 0 ? 'rotate(-1.2deg) translateX(10px)' : 'rotate(0.8deg)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          {project.name}
                        </span>
                        {project.status && (
                          <span style={{
                            fontSize: 10, fontWeight: 510, padding: '2px 7px', borderRadius: 9999, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 6,
                            background: statusBg[project.status] ?? statusBg.active,
                            color: statusText[project.status] ?? statusText.active,
                            border: `1px solid ${statusBorder[project.status] ?? statusBorder.active}`,
                          }}>
                            {project.status}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: 8 }}>
                        {(project.shortDescription ?? '').slice(0, 72)}{project.shortDescription?.length > 72 ? '…' : ''}
                      </p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {techStack.slice(0, 3).map((tech: string) => (
                          <span key={tech} style={{
                            fontSize: 10, padding: '2px 6px', borderRadius: 9999,
                            background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                            border: '1px solid var(--border-default)',
                          }}>
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {/* Decorative glow */}
                <div style={{
                  position: 'absolute', bottom: -32, right: -24, width: 140, height: 140,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(94,106,210,0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
              </div>
            )}
          </div>
        </section>

        {/* ── Tech Stack ───────────────────────────────────────────────── */}
        <section
          className="max-w-5xl mx-auto px-6 py-14"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <h2
            className="mb-8"
            style={{ fontSize: 13, fontWeight: 510, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}
          >
            {t('techStackHeading')}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                className="ds-card-hover"
                style={{
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 12,
                  padding: '20px 20px 18px',
                  cursor: 'default',
                }}
              >
                <div className="mb-3">{tech.icon}</div>
                <p style={{ fontSize: 14, fontWeight: 510, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {tech.name}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  {tech.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Latest Posts ─────────────────────────────────────────────── */}
        {blogs.length > 0 && (
          <section
            className="max-w-5xl mx-auto px-6 py-14"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-baseline justify-between mb-8">
              <h2 style={{ fontSize: 20, fontWeight: 510, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
                {t('latestPosts')}
              </h2>
              <Link
                href="/blog"
                style={{ fontSize: 13, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 510 }}
              >
                {tCommon('viewAll')}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {blogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  title={blog.title}
                  slug={blog.slug}
                  excerpt={blog.excerpt}
                  coverImage={blog.coverImage}
                  category={typeof blog.category === 'object' ? blog.category : null}
                  tags={Array.isArray(blog.tags) ? blog.tags.filter((tag: any) => typeof tag === 'object') : []}
                  publishedAt={blog.publishedAt}
                  featured={blog.featured}
                  content={blog.content}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Latest Projects ──────────────────────────────────────────── */}
        <section
          className="max-w-5xl mx-auto px-6 py-14"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-baseline justify-between mb-8">
            <h2 style={{ fontSize: 20, fontWeight: 510, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
              {t('latestProjects')}
            </h2>
            <Link
              href={`/${locale}/projects`}
              style={{ fontSize: 13, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}
            >
              {t('projects')} →
            </Link>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project: any) => (
                <HomeProjectCard key={project.id} project={project} locale={locale} />
              ))}
            </div>
          ) : (
            /* Placeholder state */
            <div
              style={{
                background: 'var(--bg-panel)',
                border: '1px dashed var(--border-default)',
                borderRadius: 12,
                padding: '48px 32px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: 'var(--accent-subtle)',
                  border: '1px solid rgba(94,106,210,0.20)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <path d="M14 17.5h7M17.5 14v7"/>
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 510, color: 'var(--text-primary)', marginBottom: 6 }}>
                {t('noProjectsYet')}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                {t('noProjectsNote')}
              </p>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

