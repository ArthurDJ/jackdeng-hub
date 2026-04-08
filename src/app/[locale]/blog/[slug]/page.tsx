import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from '@/lib/payload'
import { TagBadge } from '@/components/TagBadge'
import { CategoryBadge } from '@/components/CategoryBadge'
import { LexicalRenderer } from '@/components/LexicalRenderer'
import { Navbar } from '@/components/Navbar'
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
    <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero image */}
      {heroUrl && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '21/9', maxHeight: 480, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
          <Image
            src={heroUrl}
            alt={(blog.coverImage as any)?.alt ?? blog.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.5), transparent)' }} />
        </div>
      )}

      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '40px 24px', flex: 1, width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48 }} className="article-layout">
          <style>{`
            @media (min-width: 1024px) {
              .article-layout { grid-template-columns: 1fr 260px !important; }
            }
          `}</style>

          {/* Article */}
          <article>
            {/* Breadcrumb */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 24 }}>
              <Link href="/blog" className="ds-breadcrumb"
                style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
              >
                Blog
              </Link>
              {category && (
                <>
                  <span style={{ opacity: 0.4 }}>/</span>
                  <Link href={`/blog/category/${category.slug}`}
                    className="ds-breadcrumb"
                    style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
                  >
                    {category.name}
                  </Link>
                </>
              )}
            </nav>

            {/* Header */}
            <header style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                {category && <CategoryBadge name={category.name} slug={category.slug} static />}
                {blog.publishedAt && (
                  <time style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                    {formatDate(blog.publishedAt)}
                  </time>
                )}
              </div>

              <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 590, letterSpacing: '-0.8px', lineHeight: 1.2, color: 'var(--text-primary)', marginBottom: 16 }}>
                {blog.title}
              </h1>

              {blog.excerpt && (
                <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7, fontWeight: 300 }}>
                  {blog.excerpt}
                </p>
              )}

              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
                  {tags.map((tag) => (
                    <TagBadge key={tag.id} name={tag.name} slug={tag.slug} color={tag.color} />
                  ))}
                </div>
              )}
            </header>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 32 }} />

            {/* Body */}
            <div style={{ color: 'var(--text-secondary)' }}>
              <LexicalRenderer content={blog.content} />
            </div>

            {/* Back link */}
            <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
              <Link
                href="/blog"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 510,
                  color: 'var(--accent-primary)',
                  textDecoration: 'none',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Back to all posts
              </Link>
            </div>

            {/* ── Comments ── */}
            <div style={{ marginTop: 64, display: 'flex', flexDirection: 'column', gap: 40 }}>
              <CommentList postId={blog.id} />

              <div style={{ height: 1, background: 'var(--border-subtle)' }} />

              <div>
                <h2 style={{ fontSize: 16, fontWeight: 510, color: 'var(--text-primary)', marginBottom: 24 }}>
                  Leave a comment
                </h2>
                <CommentForm postId={blog.id} />
                <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Comments are reviewed before appearing. No spam, no selling your email.
                </p>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <Sidebar {...sidebar} />
        </div>
      </div>
    </div>
  )
}
