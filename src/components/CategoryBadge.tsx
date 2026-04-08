import Link from 'next/link'

interface CategoryBadgeProps {
  name: string
  slug: string
  static?: boolean
}

export function CategoryBadge({ name, slug, static: isStatic }: CategoryBadgeProps) {
  const inner = (
    <span
      className="inline-flex items-center rounded uppercase tracking-wide"
      style={{
        padding: '2px 10px',
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: 'var(--bg-elevated)',
        color: 'var(--text-tertiary)',
        border: '1px solid var(--border-default)',
        letterSpacing: '0.06em',
      }}
    >
      {name}
    </span>
  )
  if (isStatic) return inner
  return (
    <Link href={`/blog/category/${slug}`} className="hover:opacity-75 transition-opacity">
      {inner}
    </Link>
  )
}
