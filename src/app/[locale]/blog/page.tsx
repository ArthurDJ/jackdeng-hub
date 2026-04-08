import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getPayload } from '@/lib/payload'
import { BlogCard } from '@/components/BlogCard'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { buildSidebarData } from '@/lib/sidebarData'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })
  return { title: t('title'), description: t('subtitle') }
}

export default async function BlogListPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })

  const payload = await getPayload()
  const blogsResult = await payload.find({
    collection: 'blogs',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    depth: 2,
    limit: 12,
    locale: locale as any,
  })

  const sidebar = await buildSidebarData()
  const blogs = blogsResult.docs as any[]

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Page header */}
      <section style={{ borderBottom: '1px solid var(--border-subtle)', padding: '48px 24px 40px' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 590, letterSpacing: '-0.8px', color: 'var(--text-primary)', marginBottom: 8 }}>
            {t('title')}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-tertiary)', fontWeight: 400 }}>
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Content */}
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '40px 24px', flex: 1, width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }} className="blog-layout">
          <style>{`
            @media (min-width: 1024px) {
              .blog-layout { grid-template-columns: 1fr 260px !important; }
            }
          `}</style>

          {/* Posts grid */}
          <section>
            {blogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <p style={{ fontSize: 15, color: 'var(--text-tertiary)' }}>{t('noPostsFound')}</p>
              </div>
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

          <Sidebar {...sidebar} />
        </div>
      </div>
    </div>
  )
}
