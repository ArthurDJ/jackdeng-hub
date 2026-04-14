import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPayload } from '@/lib/payload'
import { LexicalRenderer } from '@/components/LexicalRenderer'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string; locale: string }> }

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

export async function generateStaticParams() {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'projects',
    limit: 1000,
    depth: 0,
  })
  const paths = []
  for (const doc of docs as any[]) {
    if (!doc.slug) continue
    for (const locale of ['en', 'zh']) {
      paths.push({ locale, slug: doc.slug })
    }
  }
  return paths
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  const project = docs[0] as any
  if (!project) return { title: 'Not Found' }

  const title = project.name
  const description = project.shortDescription
  const coverUrl = (project.coverImage as any)?.url
  const ogImage = coverUrl ?? `${BASE}/og?title=${encodeURIComponent(title)}&type=project`

  return {
    title: `${title} — Jack Deng`,
    description,
    openGraph: {
      title: `${title} — Jack Deng`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogImage],
    },
    alternates: {
      canonical: `${BASE}/${locale}/projects/${slug}`,
      languages: {
        en: `${BASE}/en/projects/${slug}`,
        zh: `${BASE}/zh/projects/${slug}`,
      },
    },
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug, locale } = await params
  const payload = await getPayload()

  const { docs } = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })

  const project = docs[0] as any
  if (!project) notFound()

  const t = await getTranslations({ locale, namespace: 'projects' })
  const tHome = await getTranslations({ locale, namespace: 'home' })

  const techStack: string[] = (project.techStack ?? []).map((t: any) => t.tech).filter(Boolean)
  const coverUrl: string | null = (project.coverImage as any)?.url ?? null
  const logoUrl: string | null = (project.logo as any)?.url ?? null

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    active:    { bg: 'rgba(16,185,129,0.10)', text: '#10b981', border: 'rgba(16,185,129,0.20)' },
    completed: { bg: 'rgba(94,106,210,0.10)', text: '#7170ff', border: 'rgba(94,106,210,0.20)' },
    'on-hold': { bg: 'rgba(245,158,11,0.10)', text: '#f59e0b', border: 'rgba(245,158,11,0.20)' },
  }
  const statusLabel: Record<string, string> = {
    active:    tHome('projectStatus.active'),
    completed: tHome('projectStatus.completed'),
    'on-hold': tHome('projectStatus.onHold'),
  }
  const sc = statusColors[project.status] ?? statusColors['active']

  // Other projects (exclude current)
  const { docs: otherProjects } = await payload.find({
    collection: 'projects',
    where: { slug: { not_equals: slug } },
    sort: '-createdAt',
    depth: 1,
    limit: 3,
  }).catch(() => ({ docs: [] }))

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.name,
    description: project.shortDescription,
    url: `${BASE}/${locale}/projects/${slug}`,
    ...(project.link ? { sameAs: project.link } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="ds-container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '1.5rem', fontSize: 13, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href={`/${locale}/projects`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            {t('title')}
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)' }}>{project.name}</span>
        </nav>

        <div style={{ maxWidth: 800 }}>
          {/* Cover image */}
          {coverUrl && (
            <div style={{ marginBottom: '2rem', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
              <Image
                src={coverUrl}
                alt={project.name}
                width={1200}
                height={630}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          )}

          {/* Header: logo + name + status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: '1rem' }}>
            {logoUrl && (
              <Image
                src={logoUrl}
                alt={`${project.name} logo`}
                width={48}
                height={48}
                style={{ borderRadius: 10, flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
                  {project.name}
                </h1>
                {project.status && (
                  <span style={{
                    fontSize: 12, fontWeight: 510, padding: '3px 10px', borderRadius: 9999,
                    background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                  }}>
                    {statusLabel[project.status] ?? project.status}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0.4rem 0 0' }}>
                {project.shortDescription}
              </p>
            </div>
          </div>

          {/* Tech stack */}
          {techStack.length > 0 && (
            <div style={{ marginBottom: '1.75rem' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {t('techStack')}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {techStack.map((tech) => (
                  <span key={tech} style={{
                    fontSize: 12, padding: '4px 10px', borderRadius: 9999,
                    background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)', fontWeight: 500,
                  }}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {(project.link || project.githubLink) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '2rem' }}>
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: 'var(--accent-primary)', color: '#fff', textDecoration: 'none',
                    border: 'none',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  {t('viewLiveProject')}
                </a>
              )}
              {project.githubLink && (
                <a
                  href={project.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                    textDecoration: 'none', border: '1px solid var(--border-default)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  {t('viewOnGitHub')}
                </a>
              )}
            </div>
          )}

          {/* Long description */}
          {project.longDescription && (
            <div className="prose-ds" style={{ marginBottom: '3rem' }}>
              <LexicalRenderer content={project.longDescription} />
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border-default)', margin: '2rem 0' }} />

          {/* Back link */}
          <Link
            href={`/${locale}/projects`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}
          >
            {t('backToProjects')}
          </Link>
        </div>

        {/* Other projects */}
        {(otherProjects as any[]).length > 0 && (
          <section style={{ marginTop: '4rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
              {t('relatedProjects')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {(otherProjects as any[]).filter(p => p.slug).map((other) => {
                const oSc = statusColors[other.status] ?? statusColors['active']
                const oTech: string[] = (other.techStack ?? []).map((t: any) => t.tech).filter(Boolean)
                return (
                  <Link
                    key={other.id}
                    href={`/${locale}/projects/${other.slug}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="ds-card-hover" style={{
                      background: 'var(--bg-panel)', border: '1px solid var(--border-default)',
                      borderRadius: 10, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 510, color: 'var(--text-primary)', lineHeight: 1.4 }}>{other.name}</span>
                        {other.status && (
                          <span style={{ fontSize: 10, fontWeight: 510, padding: '2px 6px', borderRadius: 9999, whiteSpace: 'nowrap', background: oSc.bg, color: oSc.text, border: `1px solid ${oSc.border}`, flexShrink: 0 }}>
                            {statusLabel[other.status]}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {other.shortDescription}
                      </p>
                      {oTech.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {oTech.slice(0, 3).map(tech => (
                            <span key={tech} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 9999, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>{tech}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
