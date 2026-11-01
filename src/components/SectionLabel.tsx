import type { ReactNode } from 'react'

/**
 * The small upper-case caption that heads each section of About and Uses.
 * About renders it as a <p> (its sections are one résumé block, headed by the
 * page's h1); Uses passes `as="h2"` so each software group is a heading.
 */
export function SectionLabel({ children, as: Tag = 'p' }: { children: ReactNode; as?: 'p' | 'h2' }) {
  return (
    <Tag className="print:break-after-avoid" style={{
      fontSize: 11,
      fontWeight: 510,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)',
      marginBottom: 20,
    }}>
      {children}
    </Tag>
  )
}
