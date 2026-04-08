import Link from 'next/link'

interface TagBadgeProps {
  name: string
  slug: string
  color?: string
  /** When true the badge is not a link (e.g. inside a card that is already a link) */
  static?: boolean
}

/**
 * Renders a coloured pill for a blog tag.
 * Background is a 15% opacity version of the tag's hex colour.
 */
export function TagBadge({ name, slug, color = '#3B82F6', static: isStatic }: TagBadgeProps) {
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16) || 59
  const g = parseInt(hex.slice(2, 4), 16) || 130
  const b = parseInt(hex.slice(4, 6), 16) || 246

  const isDarkBase = r < 50 && g < 50 && b < 50

  const style = {
    backgroundColor: `rgba(${r},${g},${b},0.12)`,
    borderColor: `rgba(${r},${g},${b},0.35)`,
  }

  const inner = (
    <span
      style={style}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${isDarkBase ? 'text-zinc-800 dark:text-zinc-300' : ''}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: isDarkBase ? 'currentColor' : color }}
        aria-hidden
      />
      <span style={!isDarkBase ? { color } : undefined}>{name}</span>
    </span>
  )

  if (isStatic) return inner

  return (
    <Link href={`/blog/tag/${slug}`} className="hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  )
}
