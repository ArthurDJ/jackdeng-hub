// A server component: next-intl's useTranslations works here too.
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { Project } from '@/payload-types'
import { badgeLabels, projectBadge } from '@/lib/projectBadge'
import { projectDiagram } from '@/lib/projectDiagrams'
import { ProjectDiagram } from '@/components/ProjectDiagram'

interface HomeProjectCardProps {
  project: Project
}

export function HomeProjectCard({ project }: HomeProjectCardProps) {
  const t = useTranslations('home')
  const badge = projectBadge(project, badgeLabels(t))
  const techStack: string[] = (project.techStack ?? []).map((ts) => ts.tech).filter(Boolean)
  const hasSlug = Boolean(project.slug)
  const diagram = projectDiagram(project.slug)

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
      {/* Cover: the project's architecture in miniature, or plain dots when
          it has none. Decoration either way, and left off paper. */}
      {diagram && project.slug ? (
        <ProjectDiagram slug={project.slug} stages={diagram} mini />
      ) : (
        <div aria-hidden="true" className="ds-dot-cover print:hidden!" style={{ height: 72, flexShrink: 0 }} />
      )}
      <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 510, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {project.name}
        </h3>
        {badge && (
          <span style={{
            fontSize: 11, fontWeight: 510, padding: '2px 8px', borderRadius: 9999,
            whiteSpace: 'nowrap', background: badge.colors.bg, color: badge.colors.text, border: `1px solid ${badge.colors.border}`, flexShrink: 0,
          }}>
            {badge.label}
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
        {/* No "Live" link here. The whole card is one link to the project page,
            which has the live and GitHub links; a second link nested inside it
            was a span with onClick that no keyboard could reach, and the only
            reason this file was a client component. */}
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
