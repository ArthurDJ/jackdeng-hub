import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getPayload } from '@/lib/payload'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'projects' })
  return {
    title: `${t('title')} — Jack Deng`,
    description: t('subtitle'),
    alternates: {
      canonical: `${BASE}/${locale}/projects`,
      languages: { en: `${BASE}/en/projects`, zh: `${BASE}/zh/projects` },
    },
  }
}

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'projects' })
  const tHome = await getTranslations({ locale, namespace: 'home' })

  const payload = await getPayload()
  const { docs: projects } = await payload.find({
    collection: 'projects',
    sort: '-createdAt',
    depth: 1,
    limit: 100,
  }).catch(() => ({ docs: [] }))

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    active:    { bg: 'rgba(16,185,129,0.10)', text: '#10b981', border: 'rgba(16,185,129,0.20)' },
    completed: { bg: 'rgba(94,106,210,0.10)', text: '#7170ff', border: 'rgba(94,106,210,0.20)' },
    'on-hold': { bg: 'rgba(245,158,11,0.10)', text: '#f59e0b', border: 'rgba(245,158,11,0.20)' },
  }

  return (
    <main className="ds-container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      {/* Page header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          {t('title')}
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {t('subtitle')}
        </p>
      </div>

      {/* Projects grid */}
      {(projects as any[]).length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>{t('noProjects')}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {(projects as any[]).map((project) => {
            const sc = statusColors[project.status] ?? statusColors['active']
            const statusLabel: Record<string, string> = {
              active:    tHome('projectStatus.active'),
              completed: tHome('projectStatus.completed'),
              'on-hold': tHome('projectStatus.onHold'),
            }
            const techStack: string[] = (project.techStack ?? []).map((t: any) => t.tech).filter(Boolean)
            const hasSlug = Boolean(project.slug)

            const CardInner = (
              <div
                className={hasSlug ? 'ds-card-hover' : undefined}
                style={{
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 12,
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  height: '100%',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                {/* Name + status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 510, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>
                    {project.name}
                  </h2>
                  {project.status && (
                    <span style={{
                      fontSize: 11, fontWeight: 510, padding: '2px 8px', borderRadius: 9999,
                      whiteSpace: 'nowrap', background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                      flexShrink: 0,
                    }}>
                      {statusLabel[project.status] ?? project.status}
                    </span>
                  )}
                </div>

                {/* Short description */}
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, margin: 0 }}>
                  {project.shortDescription}
                </p>

                {/* Tech stack tags */}
                {techStack.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {techStack.slice(0, 5).map((tech) => (
                      <span key={tech} style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 9999,
                        background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                        border: '1px solid var(--border-default)',
                      }}>
                        {tech}
                      </span>
                    ))}
                    {techStack.length > 5 && (
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>+{techStack.length - 5}</span>
                    )}
                  </div>
                )}

                {/* CTA */}
                {hasSlug && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 12, fontWeight: 510, color: 'var(--accent-primary)', marginTop: 4,
                  }}>
                    {t('viewDetails')}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </span>
                )}
              </div>
            )

            return hasSlug ? (
              <Link key={project.id} href={`/${locale}/projects/${project.slug}`} style={{ textDecoration: 'none', display: 'flex' }}>
                {CardInner}
              </Link>
            ) : (
              <div key={project.id} style={{ display: 'flex' }}>
                {CardInner}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
