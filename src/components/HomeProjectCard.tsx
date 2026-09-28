'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { Project } from '@/payload-types'
import { projectStatusColors } from '@/lib/statusColors'

interface HomeProjectCardProps {
  project: Project
}

export function HomeProjectCard({ project }: HomeProjectCardProps) {
  const t = useTranslations('home')
  const statusLabel: Record<string, string> = {
    active:    t('projectStatus.active'),
    completed: t('projectStatus.completed'),
    'on-hold': t('projectStatus.onHold'),
  }
  const sc = projectStatusColors(project.status)
  const techStack: string[] = (project.techStack ?? []).map((ts) => ts.tech).filter(Boolean)
  const hasSlug = Boolean(project.slug)

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-default)',
    borderRadius: 12,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    textDecoration: 'none',
    color: 'inherit',
  }

  const inner = (
    <div className="ds-card-hover ds-spotlight ds-tilt print:break-inside-avoid" style={cardStyle}>
      {/* Dot cover: decoration in the theme's tokens, and left off paper */}
      <div aria-hidden="true" className="ds-dot-cover print:hidden!" style={{ height: 72, flexShrink: 0 }} />
      <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 510, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {project.name}
        </h3>
        {project.status && (
          <span style={{
            fontSize: 11, fontWeight: 510, padding: '2px 8px', borderRadius: 9999,
            whiteSpace: 'nowrap', background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, flexShrink: 0,
          }}>
            {statusLabel[project.status] ?? project.status}
          </span>
        )}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
        {project.shortDescription}
      </p>
      {techStack.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {techStack.slice(0, 4).map((tech: string) => (
            <span key={tech} style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 9999,
              background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
            }}>
              {tech}
            </span>
          ))}
        </div>
      )}
      <div className="print:hidden!" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        {hasSlug && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 510, color: 'var(--accent-primary)',
          }}>
            {t('viewProject')}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </span>
        )}
        {project.link && (
          <span
            role="link"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.open(project.link, '_blank', 'noopener,noreferrer')
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 510, color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Live
          </span>
        )}
      </div>
      </div>
    </div>
  )

  return hasSlug ? (
    // Locale-less: this Link is next-intl's and adds the prefix itself. Writing
    // /${locale}/ here produced /en/en/projects/…, and every card on the home
    // page led to a 404.
    <Link href={`/projects/${project.slug}`} style={{ textDecoration: 'none', display: 'flex', flex: 1 }}>
      {inner}
    </Link>
  ) : (
    <div style={{ display: 'flex', flex: 1 }}>
      {inner}
    </div>
  )
}
