import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/Navbar'
import { BlogCard } from '@/components/BlogCard'
import { getPayload } from '@/lib/payload'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  return {
    title: t('title'),
    description: 'Senior Database & Integration Administrator. NetSuite · Boomi · Supabase · Next.js.',
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
  const tFooter = await getTranslations({ locale, namespace: 'footer' })
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

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl">

            {/* Status pill */}
            <div className="inline-flex items-center gap-2 mb-8"
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
                fontSize: 'clamp(36px, 5vw, 56px)',
                fontWeight: 590,
                letterSpacing: '-1.2px',
                lineHeight: 1.05,
                color: 'var(--text-primary)',
              }}
            >
              {t('title')}
            </h1>

            {/* Subtitle */}
            <p
              className="mb-4"
              style={{
                fontSize: 20,
                fontWeight: 300,
                color: 'var(--text-tertiary)',
                letterSpacing: '-0.2px',
              }}
            >
              {t('subtitle')}
            </p>

            {/* Bio */}
            <p
              className="mb-10 max-w-2xl"
              style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', fontWeight: 400 }}
            >
              {t.rich('bio', {
                netsuite: (c) => <span style={{ color: 'var(--text-primary)', fontWeight: 510 }}>{c}</span>,
                boomi:    (c) => <span style={{ color: 'var(--text-primary)', fontWeight: 510 }}>{c}</span>,
              })}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/blog"
                className="ds-accent-btn"
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
                {t('ctaBlog')}
              </Link>
              <Link
                href="/about"
                className="ds-ghost-btn"
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
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project: any) => (
                <ProjectCard key={project.id} project={project} t={t} />
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

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px 24px' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between"
          style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
          <span>{tCommon('copyright', { year: new Date().getFullYear() })}</span>
          <span>{tFooter('builtWith')}</span>
        </div>
      </footer>
    </div>
  )
}

/* ─── Project card sub-component ─────────────────────────────────────────── */
function ProjectCard({ project, t }: { project: any; t: any }) {
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    active:    { bg: 'rgba(16,185,129,0.10)', text: '#10b981', border: 'rgba(16,185,129,0.20)' },
    completed: { bg: 'rgba(94,106,210,0.10)', text: '#7170ff', border: 'rgba(94,106,210,0.20)' },
    'on-hold': { bg: 'rgba(245,158,11,0.10)', text: '#f59e0b', border: 'rgba(245,158,11,0.20)' },
  }
  const statusLabel: Record<string, string> = {
    active:    t('projectStatus.active'),
    completed: t('projectStatus.completed'),
    'on-hold': t('projectStatus.onHold'),
  }
  const sc = statusColors[project.status] ?? statusColors['active']

  return (
    <div
      className="ds-card-hover"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 510, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {project.name}
        </h3>
        {project.status && (
          <span style={{
            fontSize: 11,
            fontWeight: 510,
            padding: '2px 8px',
            borderRadius: 9999,
            whiteSpace: 'nowrap',
            background: sc.bg,
            color: sc.text,
            border: `1px solid ${sc.border}`,
          }}>
            {statusLabel[project.status] ?? project.status}
          </span>
        )}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
        {project.shortDescription}
      </p>
      {project.link && (
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 510,
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            marginTop: 4,
          }}
        >
          {t('viewProject')}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </a>
      )}
    </div>
  )
}
