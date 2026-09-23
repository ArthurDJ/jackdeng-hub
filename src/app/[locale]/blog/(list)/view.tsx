// Rendering for the list at /blog and its /page/N continuations, so the
// two routes share one implementation. Page 1 lives on the unnumbered URL.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPayload } from '@/lib/payload'
import { BlogCard } from '@/components/BlogCard'
import { Pagination } from '@/components/Pagination'
import { Sidebar } from '@/components/Sidebar'
import { buildSidebarData } from '@/lib/sidebarData'
import { asLocale } from '@/i18n/routing'
import { populated, populatedList } from '@/lib/relations'
import { POSTS_PER_PAGE, pageHref } from '@/lib/pagination'

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

export async function blogListMetadata(locale: string, page: number): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'blog' })
  // Each page is its own canonical URL; pointing page 2 at page 1 would tell
  // search engines the posts on it are not worth indexing.
  const path = pageHref('/blog', page)
  return {
    title: page > 1 ? `${t('title')} · ${t('pagination.page', { page })}` : t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: `${BASE}/${locale}${path}`,
      languages: { en: `${BASE}/en${path}`, zh: `${BASE}/zh${path}` },
    },
  }
}

export async function BlogListView({ locale, page }: { locale: string; page: number }) {
  const t = await getTranslations({ locale, namespace: 'blog' })


  const payload = await getPayload()

  // No fallbacks, sidebar included: blog/[slug] already lets buildSidebarData
  // throw, and an empty sidebar is still a broken page served as a 200.
  const [blogsResult, sidebar] = await Promise.all([
    payload.find({
      collection: 'blogs',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 1,
      limit: POSTS_PER_PAGE,
      page,
      locale: asLocale(locale),
    }),
    buildSidebarData({ locale: asLocale(locale) }),
  ])

  const blogs = blogsResult.docs
  const totalPages = blogsResult.totalPages ?? 1
  // A page past the end is a URL that should not exist, not an empty list.
  if (page > 1 && page > totalPages) notFound()

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
