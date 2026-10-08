import { EDUCATION } from '@/lib/profile'

// One row per degree: dates, then degree and school. Degrees carry no bullets,
// so they get a compact list rather than the experience cards.
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
          className="grid gap-1 sm:gap-5 sm:grid-cols-[132px_1fr] print:break-inside-avoid"
          style={{
            padding: '14px 20px',
            borderTop: i > 0 ? '1px solid var(--border-subtle)' : undefined,
          }}
        >
          <p style={{ fontSize: 12, fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-tertiary)', paddingTop: 2 }}>
            {year[lang]}
          </p>
          <p className="min-w-0" style={{ fontSize: 14, fontWeight: 510, color: 'var(--text-primary)' }}>
            {degree[lang]}{' '}
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>@ {school}</span>
          </p>
        </li>
      ))}
    </ol>
  )
}
