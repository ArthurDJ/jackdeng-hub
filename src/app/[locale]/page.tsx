import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { BlogCard } from '@/components/BlogCard'
import { HomeProjectCard } from '@/components/HomeProjectCard'
import { getPayload } from '@/lib/payload'
import { asLocale } from '@/i18n/routing'
import { populated, populatedList } from '@/lib/relations'
import { CONTACT_EMAIL, PROFILE_LINKS, RESUME_URL, SKILLS, TIMELINE, personJsonLd, profileOgImage } from '@/lib/profile'
import { toJsonLd } from '@/lib/jsonLd'
import { PrintContact } from '@/components/PrintContact'
import { projectStatusColors } from '@/lib/statusColors'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  return {
    // The layout's `%s — Jack Deng` template does not apply to the page in the
    // same route segment, so the homepage has to carry the name itself.
    title: `Jack Deng — ${t('title')}`,
    description: t('metaDescription'),
    openGraph: {
      siteName: 'Jack Deng',
      type: 'profile',
      title: `Jack Deng — ${t('title')}`,
      description: t('metaDescription'),
      images: [{ url: profileOgImage(BASE, t('title')), width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Jack Deng — ${t('title')}`,
      description: t('metaDescription'),
      images: [profileOgImage(BASE, t('title'))],
    },
    alternates: {
      canonical: `${BASE}/${locale}`,
      languages: { en: `${BASE}/en`, zh: `${BASE}/zh` },
    },
  }
}

/* ─── Page component ──────────────────────────────────────────────────────── */
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })

  const lang = asLocale(locale)
  // Static map — next-intl keys must stay statically analysable
  const STATUS_LABEL: Record<string, string> = {
    active: t('projectStatus.active'),
    completed: t('projectStatus.completed'),
    'on-hold': t('projectStatus.onHold'),
  }
  const github = PROFILE_LINKS.find((l) => l.icon === 'github')!
  const linkedin = PROFILE_LINKS.find((l) => l.icon === 'linkedin')!

  const payload = await getPayload()

  // No fallback: a failed query should reach error.tsx, not render as a home
  // page with no posts and no projects and a 200.
  const [blogsResult, projectsResult] = await Promise.all([
    payload.find({
      collection: 'blogs',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 1,
      limit: 3,
      locale: asLocale(locale),
    }),
    payload.find({
      collection: 'projects',
      where: { isPinned: { equals: true } },
      sort: '-createdAt',
      depth: 1,
      limit: 4,
      locale: asLocale(locale),
    }),
  ])

  const blogs = blogsResult.docs
  const projects = projectsResult.docs

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }} className="min-h-screen flex flex-col">
      <Navbar />

      <main id="main" className="flex-1">
        {/* Who this page is about, for search engines — see personJsonLd. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(personJsonLd(BASE, lang, t('title'))) }}
        />
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 sm:pt-24 sm:pb-20 print:py-0!">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">

            {/* ── Left: text ──────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Location */}
              <p className="mb-5" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 510, color: 'var(--text-tertiary)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {t('location')}
              </p>

              {/* Name first: this page stands in for a résumé, and a reader
                  should know whose it is before anything else. */}
              <h1
                className="mb-3"
                style={{
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontWeight: 590,
                  letterSpacing: '-1.4px',
                  lineHeight: 1.05,
                  color: 'var(--text-primary)',
                }}
              >
                Jack Deng
              </h1>
              <p
                className="mb-5"
                style={{ fontSize: 'clamp(18px, 2.2vw, 22px)', fontWeight: 510, letterSpacing: '-0.3px', color: 'var(--text-secondary)' }}
              >
                {t('title')}
              </p>

              <p
                className="mb-8"
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  maxWidth: 520,
                }}
              >
                {t('intro')}
              </p>
              <PrintContact />

              {/* CTAs — the résumé and a way to reach me, where a recruiter
                  looks first. These used to live only at the bottom of /about. */}
              <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-3 print:hidden!">
                <a
                  href={RESUME_URL}
                  className="ds-accent-btn w-full sm:w-auto text-center justify-center"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 22px',
                    borderRadius: 9999,
                    background: 'var(--accent-solid)',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {t('ctaResume')}
                </a>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="ds-ghost-btn w-full sm:w-auto text-center justify-center"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 22px',
                    borderRadius: 9999,
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  {t('ctaEmail')}
                </a>
                <div className="flex gap-2 justify-center sm:justify-start">
                  {[github, linkedin].map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={l.label}
                      className="ds-ghost-btn"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 40, height: 40, borderRadius: 9999,
                        border: '1px solid var(--border-default)', color: 'var(--text-secondary)',
                      }}
                    >
                      {l.icon === 'github' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: floating project preview cards ───────────────── */}
            {projects.length > 0 && (
              <div className="hidden lg:flex flex-col gap-3 flex-shrink-0 w-72 relative pt-4 print:hidden!">
                {projects.slice(0, 2).map((project, i) => {
                  const techStack: string[] = (project.techStack ?? []).map((ts) => ts.tech).filter(Boolean)
                  const sc = projectStatusColors(project.status)
                  const href = project.slug ? `/projects/${project.slug}` : '/projects'
                  return (
                    <Link
                      key={project.id}
                      href={href}
                      className="ds-card-hover"
                      style={{
                        display: 'block',
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                        transform: i === 0 ? 'rotate(-1.2deg) translateX(10px)' : 'rotate(0.8deg)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          {project.name}
                        </span>
                        {project.status && (
                          <span style={{
                            fontSize: 10, fontWeight: 510, padding: '2px 7px', borderRadius: 9999, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 6,
                            background: sc.bg,
                            color: sc.text,
                            border: `1px solid ${sc.border}`,
                          }}>
                            {STATUS_LABEL[project.status] ?? project.status}
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
                    </Link>
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

        {/* ── Experience ───────────────────────────────────────────── */}
        <section
          className="max-w-5xl mx-auto px-6 py-14 print:py-5!"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-baseline justify-between mb-8">
            <h2 style={{ fontSize: 20, fontWeight: 510, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
              {t('experienceHeading')}
            </h2>
            <Link href="/about" className="print:hidden!" style={{ fontSize: 13, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 510 }}>
              {t('experienceMore')}
            </Link>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TIMELINE.map(({ year, role, place, bullets, tech }) => (
              <li
                key={year.en}
                className="grid gap-2 sm:gap-6 sm:grid-cols-[160px_1fr] print:break-inside-avoid"
                style={{
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 12,
                  padding: '18px 20px',
                }}
              >
                <p style={{ fontSize: 12, fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-tertiary)', paddingTop: 2 }}>
                  {year[lang]}
                </p>
                <div className="min-w-0">
                  <p style={{ fontSize: 15, fontWeight: 510, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {role[lang]} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>@ {place}</span>
                  </p>
                  {/* The lead achievement only; the rest is one click away. */}
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
                    {bullets[lang][0]}
                  </p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {tech.slice(0, 6).map((tch) => (
                      <span key={tch} style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 9999,
                        background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                        border: '1px solid var(--border-default)',
                      }}>
                        {tch}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Skills ───────────────────────────────────────────────── */}
        <section
          className="max-w-5xl mx-auto px-6 py-14 print:py-5!"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <h2
            className="mb-8"
            style={{ fontSize: 20, fontWeight: 510, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}
          >
            {t('skillsHeading')}
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {SKILLS.map(({ group, items }) => (
              <div key={group.en}>
                <dt style={{ fontSize: 11, fontWeight: 510, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  {group[lang]}
                </dt>
                <dd style={{ margin: 0, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {items.map((item) => (
                    <span key={item} style={{
                      fontSize: 13, padding: '3px 10px', borderRadius: 9999,
                      background: 'var(--bg-panel)', color: 'var(--text-primary)',
                      border: '1px solid var(--border-default)',
                    }}>
                      {item}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Latest Projects ──────────────────────────────────────────── */}
        <section
          className="max-w-5xl mx-auto px-6 py-14 print:py-5!"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-baseline justify-between mb-8">
            <h2 style={{ fontSize: 20, fontWeight: 510, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
              {t('selectedProjects')}
            </h2>
            <Link
              href="/projects"
              className="print:hidden!"
              style={{ fontSize: 13, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}
            >
              {t('projects')} →
            </Link>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <HomeProjectCard key={project.id} project={project} />
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

        {/* ── Latest Posts ─────────────────────────────────────────────── */}
        {blogs.length > 0 && (
          <section
            className="max-w-5xl mx-auto px-6 py-14 print:hidden!"
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
                  coverImage={populated(blog.coverImage)}
                  category={populated(blog.category)}
                  tags={populatedList(blog.tags)}
                  publishedAt={blog.publishedAt}
                  featured={blog.featured}
                  content={blog.content}
                />
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}

