import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from '@/lib/payload'
import { Sidebar } from '@/components/Sidebar'
import { buildSidebarData } from '@/lib/sidebarData'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Archive — Blog — Jack Deng',
  description: 'All blog posts organized by year and month.',
}

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const sp = await searchParams
  const filterYear = sp.year ? parseInt(sp.year, 10) : null
  const filterMonth = sp.month ? parseInt(sp.month, 10) : null

  const payload = await getPayload()

  const { docs: all } = await payload.find({
    collection: 'blogs',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    depth: 1,
    limit: 1000,
  })

  const sidebar = await buildSidebarData()

  // Group by year → month → posts
  const grouped: Record<number, Record<number, any[]>> = {}
  for (const blog of all as any[]) {
    if (!blog.publishedAt) continue
    const d = new Date(blog.publishedAt)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    if (!grouped[y]) grouped[y] = {}
    if (!grouped[y][m]) grouped[y][m] = []
    grouped[y][m].push(blog)
  }

  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a)

  // If a year/month filter is active, only show that bucket
  const displayYears = filterYear ? [filterYear] : years
  const totalCount = (all as any[]).length

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <section className="border-b border-zinc-200 dark:border-zinc-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Archive</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            {totalCount} post{totalCount !== 1 ? 's' : ''} in total
          </p>
          {(filterYear || filterMonth) && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Showing:</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {filterMonth ? MONTHS[filterMonth - 1] : ''}{' '}
                {filterYear ?? ''}
              </span>
              <Link
                href="/blog/archive"
                className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear filter
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          <div className="space-y-12">
            {displayYears.map((year) => {
              const monthsInYear = Object.keys(grouped[year] ?? {})
                .map(Number)
                .filter((m) => !filterMonth || m === filterMonth)
                .sort((a, b) => b - a)

              if (monthsInYear.length === 0) return null

              return (
                <section key={year}>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    {year}
                  </h2>
                  <div className="space-y-8">
                    {monthsInYear.map((month) => {
                      const posts = grouped[year][month]
                      return (
                        <div key={month}>
                          <Link
                            href={`/blog/archive?year=${year}&month=${month}`}
                            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-3"
                          >
                            {MONTHS[month - 1]}
                            <span className="font-normal normal-case text-xs tabular-nums">
                              ({posts.length})
                            </span>
                          </Link>
                          <ul className="space-y-2 pl-1">
                            {posts.map((blog: any) => (
                              <li key={blog.id} className="flex items-start gap-3">
                                <time className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums pt-0.5 w-24 flex-shrink-0">
                                  {formatDate(blog.publishedAt)}
                                </time>
                                <Link
                                  href={`/blog/${blog.slug}`}
                                  className="text-sm text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-snug"
                                >
                                  {blog.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
            {years.length === 0 && (
              <p className="text-zinc-500 dark:text-zinc-400 text-center py-12">No published posts yet.</p>
            )}
          </div>

          <Sidebar {...sidebar} />
        </div>
      </div>
    </main>
  )
}
