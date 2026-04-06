import Link from 'next/link'
import Image from 'next/image'
import { TagBadge } from './TagBadge'

interface Category { id: string; name: string; slug: string; _count?: number }
interface Tag { id: string; name: string; slug: string; color: string }
interface RecentPost { title: string; slug: string; publishedAt?: string | null; coverImage?: { url?: string; sizes?: { thumbnail?: { url?: string } }; alt?: string } | null }
interface ArchiveEntry { year: number; month: number; label: string; count: number }

interface SidebarProps {
  categories?: Category[]
  tags?: Tag[]
  recentPosts?: RecentPost[]
  archives?: ArchiveEntry[]
  activeCategory?: string
  activeTag?: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function Sidebar({ categories = [], tags = [], recentPosts = [], archives = [], activeCategory, activeTag }: SidebarProps) {
  return (
    <aside className="flex flex-col gap-8">

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">Categories</h3>
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/blog/category/${cat.slug}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeCategory === cat.slug
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat._count != null && (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">{cat._count}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div key={tag.id} className={activeTag === tag.slug ? 'ring-2 ring-offset-1 ring-blue-400 rounded-full' : ''}>
                <TagBadge name={tag.name} slug={tag.slug} color={tag.color} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">Recent Posts</h3>
          <ul className="space-y-3">
            {recentPosts.map((post) => {
              const thumb = post.coverImage?.sizes?.thumbnail?.url ?? post.coverImage?.url
              return (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="flex items-center gap-3 group">
                    {thumb ? (
                      <div className="relative w-14 h-10 flex-shrink-0 rounded overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <Image src={thumb} alt={post.coverImage?.alt ?? post.title} fill className="object-cover" sizes="56px" />
                      </div>
                    ) : (
                      <div className="w-14 h-10 flex-shrink-0 rounded bg-zinc-100 dark:bg-zinc-800" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </p>
                      {post.publishedAt && (
                        <time className="text-xs text-zinc-400 dark:text-zinc-500">{formatDate(post.publishedAt)}</time>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Archive */}
      {archives.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">Archive</h3>
          <ul className="space-y-1">
            {archives.map((entry) => (
              <li key={`${entry.year}-${entry.month}`}>
                <Link
                  href={`/blog/archive?year=${entry.year}&month=${entry.month}`}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  <span>{entry.label}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">{entry.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  )
}
