import Link from 'next/link'

interface CategoryBadgeProps {
  name: string
  slug: string
  static?: boolean
}

export function CategoryBadge({ name, slug, static: isStatic }: CategoryBadgeProps) {
  const inner = (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 uppercase tracking-wide">
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
