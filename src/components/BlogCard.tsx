import Link from 'next/link'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import { TagBadge } from './TagBadge'
import { CategoryBadge } from './CategoryBadge'
import { readingTime } from '@/lib/readingTime'
import { formatDate } from '@/lib/formatDate'

interface Tag     { id: string; name: string; slug: string; color: string }
interface Category { id: string; name: string; slug: string }
interface MediaDoc {
  url?: string
  sizes?: { card?: { url?: string }; thumbnail?: { url?: string } }
  alt?: string
  width?: number
  height?: number
}

export interface BlogCardProps {
  title: string
  slug: string
  excerpt: string
  coverImage?: MediaDoc | null
  category?: Category | null
  tags?: Tag[]
  publishedAt?: string | null
  featured?: boolean
  content?: unknown
}


export async function BlogCard({ title, slug, excerpt, coverImage, category, tags = [], publishedAt, featured, content }: BlogCardProps) {
  const imageUrl = coverImage?.sizes?.card?.url ?? coverImage?.sizes?.thumbnail?.url ?? coverImage?.url

  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'blog' })
  const minutes = content != null ? readingTime(content) : null

  return (
    <article
      className="ds-card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Cover */}
      <Link href={`/blog/${slug}`} style={{ display: 'block', position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--bg-elevated)' }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={coverImage?.alt ?? title}
            fill
            className="object-cover"
            style={{ transition: 'transform 300ms' }}
            sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-disabled)' }}>
            <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {featured && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            padding: '2px 8px', borderRadius: 9999,
            fontSize: 11, fontWeight: 510,
            background: 'rgba(0,0,0,0.65)', color: '#ffffff',
            backdropFilter: 'blur(4px)',
          }}>
            Featured
          </span>
        )}
      </Link>

      {/* Body */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px 18px', gap: 10 }}>
        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {category && <CategoryBadge name={category.name} slug={category.slug} static />}
          {publishedAt && (
            <time style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 'auto', fontFamily: 'var(--font-geist-mono, monospace)' }}>
              {formatDate(publishedAt, locale)}
            </time>
          )}
          {minutes != null && (
            <span style={{ fontSize: 12, color: 'var(--text-disabled)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
              {t('minRead', { count: minutes })}
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/blog/${slug}`} style={{ textDecoration: 'none' }}>
          <h2 style={{
            fontSize: 15,
            fontWeight: 510,
            lineHeight: 1.4,
            color: 'var(--text-primary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {title}
          </h2>
        </Link>

        {/* Excerpt */}
        <p style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {excerpt}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
            {tags.map((tag) => (
              <TagBadge key={tag.id} name={tag.name} slug={tag.slug} color={tag.color} static />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
