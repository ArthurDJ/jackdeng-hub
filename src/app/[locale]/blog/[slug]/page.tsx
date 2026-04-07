import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from '@/lib/payload'
import { TagBadge } from '@/components/TagBadge'
import { CategoryBadge } from '@/components/CategoryBadge'
import { LexicalRenderer } from '@/components/LexicalRenderer'
import { Sidebar } from '@/components/Sidebar'
import { buildSidebarData } from '@/lib/sidebarData'
import { CommentList } from '@/components/CommentList'
import { CommentForm } from '@/components/CommentForm'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'blogs',
    where: { status: { equals: 'published' } },
    limit: 1000,
    depth: 0,
  })
  return (docs as any[]).map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'blogs',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  const blog = docs[0] as any
  if (!blog) return { title: 'Not Found' }

  const title = blog.seo?.metaTitle ?? blog.title
  const description = blog.seo?.metaDescription ?? blog.excerpt
  const ogImageUrl =
    (blog.seo?.ogImage as any)?.sizes?.hero?.url ??
    (blog.seo?.ogImage as any)?.url ??
    (blog.coverImage as any)?.sizes?.hero?.url ??
    (blog.coverImage as any)?.url

  return {
    title: `${title} — Jack Deng`,
    description,
    openGraph: ogImageUrl ? { images: [{ url: ogImageUrl }] } : undefined,
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload()

  const { docs } = await payload.find({
    collection: 'blogs',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 2,
    limit: 1,
  })

  const blog = docs[0] as any
  if (!blog) notFound()

  const heroUrl =
    (blog.coverImage as any)?.sizes?.hero?.url ?? (blog.coverImage as any)?.url

  const category = typeof blog.category === 'object' ? blog.category : null
  const tags: any[] = Array.isArray(blog.tags)
    ? blog.tags.filter((t: any) => typeof t === 'object')
    : []

  const sidebar = await buildSidebarData({ activeCategory: category?.slug })

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Hero image */}
      {heroUrl && (
        <div className="relative w-full aspect-[21/9] max-h-[520px] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          <Image
            src={heroUrl}
            alt={(blog.coverImage as any)?.alt ?? blog.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
          {/* Article */}
          <article>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              <Link href="/blog" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Blog</Link>
              {category && (
                <>
                  <span>/</span>
                  <Link href={`/blog/category/${category.slug}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {category.name}
                  </Link>
                </>
              )}
            </nav>

            {/* Header */}
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {category && <CategoryBadge name={category.name} slug={category.slug} static />}
                {blog.publishedAt && (
                  <time className="text-sm text-zinc-500 dark:text-zinc-400">
                    {formatDate(blog.publishedAt)}
                  </time>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
                {blog.title}
              </h1>
              {blog.excerpt && (
                <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {blog.excerpt}
                </p>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {tags.map((tag) => (
                    <TagBadge key={tag.id} name={tag.name} slug={tag.slug} color={tag.color} />
                  ))}
                </div>
              )}
            </header>

            {/* Body */}
            <LexicalRenderer content={blog.content} />

            {/* Footer nav */}
            <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← Back to all posts
              </Link>
            </div>

            {/* ── Comments ── */}
            <div className="mt-16 space-y-10">
              {/* List — server component, shows approved comments */}
              <CommentList postId={blog.id} />

              {/* Divider */}
              <div className="border-t border-zinc-200 dark:border-zinc-800" />

              {/* Form — client component */}
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                  Leave a comment
                </h2>
                <CommentForm postId={blog.id} />
                <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                  Comments are reviewed before appearing. No spam, no selling your email.
                </p>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <Sidebar {...sidebar} />
        </div>
      </div>
    </main>
  )
}
