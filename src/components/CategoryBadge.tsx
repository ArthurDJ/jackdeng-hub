// next-intl's Link, which adds the current locale to these locale-less hrefs.
// next/link left them bare, so every click cost a 307 through the middleware
// (and, with cookies blocked, landed in whichever locale the browser preferred).
import { Link } from '@/i18n/navigation'

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
