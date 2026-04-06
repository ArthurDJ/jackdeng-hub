import Link from 'next/link'
import Image from 'next/image'
import { TagBadge } from './TagBadge'
import { CategoryBadge } from './CategoryBadge'

interface Tag {
  id: string
  name: string
  slug: string
  color: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface MediaDoc {
  url?: string
  sizes?: {
    card?: { url?: string }
    thumbnail?: { url?: string }
  }
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
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function BlogCard({
  title,
  slug,
  excerpt,
  coverImage,
  category,
  tags = [],
  publishedAt,
  featured,
}: BlogCardProps) {
  const imageUrl =
    coverImage?.sizes?.card?.url ?? coverImage?.sizes?.thumbnail?.url ?? coverImage?.url

  return (
    <article className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover */}
      <Link href={`/blog/${slug}`} className="relative block aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={coverImage?.alt ?? title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {featured && (
          <span className="absolute top-3 left-3 px-2 py-0.5 text-xs font-semibold bg-black/70 text-white rounded">
            Featured
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {category && <CategoryBadge name={category.name} slug={category.slug} static />}
          {publishedAt && (
            <time className="text-xs text-zinc-500 dark:text-zinc-400 ml-auto">
              {formatDate(publishedAt)}
            </time>
          )}
        </div>

        {/* Title */}
        <Link href={`/blog/${slug}`}>
          <h2 className="text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {title}
          </h2>
        </Link>

        {/* Excerpt */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3 flex-1">
          {excerpt}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <TagBadge key={tag.id} name={tag.name} slug={tag.slug} color={tag.color} static />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
