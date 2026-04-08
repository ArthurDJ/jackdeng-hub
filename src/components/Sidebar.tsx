import Link from 'next/link'
import Image from 'next/image'
import { getLocale } from 'next-intl/server'
import { TagBadge } from './TagBadge'
import { formatDate } from '@/lib/formatDate'

interface Category    { id: string; name: string; slug: string; _count?: number }
interface Tag         { id: string; name: string; slug: string; color: string }
interface RecentPost  { title: string; slug: string; publishedAt?: string | null; coverImage?: { url?: string; sizes?: { thumbnail?: { url?: string } }; alt?: string } | null }
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

function SidebarHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 510,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)',
      marginBottom: 12,
    }}>
      {children}
    </p>
  )
}

export function Sidebar({ categories = [], tags = [], recentPosts = [], archives = [], activeCategory, activeTag }: SidebarProps) {
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <SidebarHeading>Categories</SidebarHeading>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug
              return (
                <li key={cat.id}>
                  <Link
                    href={`/blog/category/${cat.slug}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: isActive ? 510 : 400,
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--accent-subtle)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'background 150ms, color 150ms',
                    }}
                  >
                    <span>{cat.name}</span>
                    {cat._count != null && (
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                        {cat._count}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <section>
          <SidebarHeading>Tags</SidebarHeading>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tags.map((tag) => (
              <div key={tag.id} style={activeTag === tag.slug ? { outline: '2px solid var(--accent-primary)', outlineOffset: 2, borderRadius: 9999 } : {}}>
                <TagBadge name={tag.name} slug={tag.slug} color={tag.color} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <section>
          <SidebarHeading>Recent Posts</SidebarHeading>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentPosts.map((post) => {
              const thumb = post.coverImage?.sizes?.thumbnail?.url ?? post.coverImage?.url
              return (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    {thumb ? (
                      <div style={{ position: 'relative', width: 48, height: 34, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
                        <Image src={thumb} alt={post.coverImage?.alt ?? post.title} fill className="object-cover" sizes="48px" />
                      </div>
                    ) : (
                      <div style={{ width: 48, height: 34, flexShrink: 0, borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: 13,
                        fontWeight: 400,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {post.title}
                      </p>
                      {post.publishedAt && (
                        <time style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                          {formatDate(post.publishedAt)}
                        </time>
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
          <SidebarHeading>Archive</SidebarHeading>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {archives.map((entry) => (
              <li key={`${entry.year}-${entry.month}`}>
                <Link
                  href={`/blog/archive?year=${entry.year}&month=${entry.month}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'background 150ms, color 150ms',
                  }}
                >
                  <span>{entry.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                    {entry.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  )
}
