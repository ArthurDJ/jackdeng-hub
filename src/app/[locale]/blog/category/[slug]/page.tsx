import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPayload } from '@/lib/payload'
import { BlogCard } from '@/components/BlogCard'
import { Sidebar } from '@/components/Sidebar'
import { buildSidebarData } from '@/lib/sidebarData'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string; locale: string }> }

export async function generateStaticParams() {
  const payload = await getPayload()
  const { docs } = await payload.find({ collection: 'categories', limit: 200, depth: 0 })

  const paths = []
  for (const doc of docs as any[]) {
    for (const locale of ['en', 'zh']) {
      paths.push({ locale, slug: doc.slug })
    }
  }
  return paths
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    locale: locale as any,
  })
  const cat = docs[0] as any
  if (!cat) return { title: 'Category not found' }
  return {
    title: `${cat.name} — Blog — Jack Deng`,
    description: cat.description ?? `Posts in the ${cat.name} category.`,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })
  const payload = await getPayload()

  const [catResult, blogsResult] = await Promise.all([
    payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1, locale: locale as any }),
    payload.find({
      collection: 'blogs',
      where: { status: { equals: 'published' }, 'category.slug': { equals: slug } },
      sort: '-publishedAt',
      depth: 1,
      limit: 50,
      locale: locale as any,
    }),
  ])

  const category = catResult.docs[0] as any
  if (!category) notFound()

  const sidebar = await buildSidebarData({ activeCategory: slug })
  const blogs = blogsResult.docs as any[]

  return (
    <main>
      {/* Header */}
      <section style={{ borderBottom: '1px solid var(--border-subtle)', padding: '48px 24px 40px' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            Category
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 590, letterSpacing: '-0.8px', color: 'var(--text-primary)', marginBottom: 8 }}>
            {category.name}
          </h1>
          {category.description && (
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 560 }}>{category.description}</p>
          )}
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-tertiary)' }}>
            {blogsResult.totalDocs} {blogsResult.totalDocs !== 1 ? t('posts') : t('post')}
          </p>
        </div>
      </section>

      {/* Content */}
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }} className="blog-layout">
          <style>{`@media (min-width: 1024px) { .blog-layout { grid-template-columns: 1fr 260px !important; } }`}</style>

          <section>
            {blogs.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '48px 0', fontSize: 15 }}>
                {t('noPostsFound')}
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {blogs.map((blog) => (
                  <BlogCard
                    key={blog.id}
                    title={blog.title}
                    slug={blog.slug}
                    excerpt={blog.excerpt}
                    coverImage={blog.coverImage}
                    category={typeof blog.category === 'object' ? blog.category : null}
                    tags={Array.isArray(blog.tags) ? blog.tags.filter((t: any) => typeof t === 'object') : []}
                    publishedAt={blog.publishedAt}
                    featured={blog.featured}
                  />
                ))}
              </div>
            )}
          </section>
          <Sidebar {...sidebar} activeCategory={slug} />
        </div>
      </div>
    </main>
  )
}
