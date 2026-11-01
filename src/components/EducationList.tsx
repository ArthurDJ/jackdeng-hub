import { EDUCATION } from '@/lib/profile'

// One row per degree: the degree with its dates, then the school on its own
// line, the same layout as the experience cards. Degrees carry no bullets,
// so they get a compact list rather than cards.
export function EducationList({ lang }: { lang: 'en' | 'zh' }) {
  return (
    <ol
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
      }}
    >
      {EDUCATION.map(({ year, degree, school }, i) => (
        <li
          key={school}
          className="print:break-inside-avoid"
          style={{
            padding: '14px 20px',
            borderTop: i > 0 ? '1px solid var(--border-subtle)' : undefined,
          }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="min-w-0" style={{ fontSize: 14, fontWeight: 510, color: 'var(--text-primary)' }}>
              {degree[lang]}
            </p>
            <p style={{ fontSize: 12, fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-tertiary)' }}>
              {year[lang]}
            </p>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {school}
          </p>
        </li>
      ))}
    </ol>
  )
}
