'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

interface HomeProjectCardProps {
  project: any
  locale: string
}

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
]

function getGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

export function HomeProjectCard({ project, locale }: HomeProjectCardProps) {
  const t = useTranslations('home')

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
  const techStack: string[] = (project.techStack ?? []).map((ts: any) => ts.tech).filter(Boolean)
  const hasSlug = Boolean(project.slug)

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-default)',
    borderRadius: 12,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    textDecoration: 'none',
    color: 'inherit',
  }

  const inner = (
    <div className="ds-card-hover" style={cardStyle}>
      {/* Gradient cover */}
      <div style={{ height: 72, flexShrink: 0, background: getGradient(project.name ?? '') }} />
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        {hasSlug && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 510, color: 'var(--accent-primary)',
          }}>
            {t('viewProject')}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
    <Link href={`/${locale}/projects/${project.slug}`} style={{ textDecoration: 'none', display: 'flex' }}>
      {inner}
    </Link>
  ) : (
    <div style={{ display: 'flex' }}>
      {inner}
    </div>
  )
}
