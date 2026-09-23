import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getPayload, orEmpty } from '@/lib/payload'
import { BlogCard } from '@/components/BlogCard'
import { Pagination } from '@/components/Pagination'
import { Sidebar } from '@/components/Sidebar'
import { buildSidebarData } from '@/lib/sidebarData'
import { asLocale } from '@/i18n/routing'
import { populated, populatedList } from '@/lib/relations'

export const revalidate = 3600

const POSTS_PER_PAGE = 12

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: `${BASE}/${locale}/blog`,
      languages: { en: `${BASE}/en/blog`, zh: `${BASE}/zh/blog` },
    },
  }
}

export default async function BlogListPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { page: pageParam } = await searchParams
  const t = await getTranslations({ locale, namespace: 'blog' })

  // Clamp to a valid positive integer
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const payload = await getPayload()

  const [blogsResult, sidebar] = await Promise.all([
    orEmpty(payload.find({
      collection: 'blogs',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 1,
      limit: POSTS_PER_PAGE,
      page,
      locale: asLocale(locale),
    })),
    buildSidebarData({ locale: asLocale(locale) }).catch(() => ({})),
  ])

  const blogs = blogsResult.docs
  const totalPages = blogsResult.totalPages ?? 1

  return (
    // blog/layout.tsx already paints the page shell; this is just the landmark
    // the skip link targets (#main).
    <main id="main">

      {/* Page header */}
      <section className="border-b border-subtle ds-section-padding">
        <div className="ds-container">
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 590, letterSpacing: '-0.8px', color: 'var(--text-primary)', marginBottom: 8 }}>
            {t('title')}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-tertiary)', fontWeight: 400 }}>
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="ds-container py-10 flex-1">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }} className="blog-layout">
          <style>{`
            @media (min-width: 1024px) {
              .blog-layout { grid-template-columns: 1fr 260px !important; }
            }
          `}</style>

          {/* Posts grid + pagination */}
          <section>
            {blogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <p style={{ fontSize: 15, color: 'var(--text-tertiary)' }}>{t('noPostsFound')}</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {blogs.map((blog) => (
                    <BlogCard
                      key={blog.id}
                      title={blog.title}
                      slug={blog.slug}
                      excerpt={blog.excerpt}
                      coverImage={populated(blog.coverImage)}
                      category={populated(blog.category)}
                      tags={populatedList(blog.tags)}
                      publishedAt={blog.publishedAt}
                      featured={blog.featured}
                      content={blog.content}
                    />
                  ))}
                </div>

                <Pagination page={page} totalPages={totalPages} basePath="/blog" />
              </>
            )}
          </section>

          <Sidebar {...sidebar} />
        </div>
      </div>
    </main>
  )
}
