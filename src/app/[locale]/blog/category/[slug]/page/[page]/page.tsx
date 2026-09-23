import { notFound, permanentRedirect } from 'next/navigation'
import { parsePageParam } from '@/lib/pagination'
import { CategoryView, categoryMetadata } from '../../view'

// Page 2 onward of /blog/category/[slug]. This route sits outside any loading.tsx on
// purpose: notFound() for a page past the end has to set a real 404 status,
// and a Suspense boundary above it commits a 200 first (#34).
export const revalidate = 3600

// Nothing is prerendered: each page renders on its first request and is then
// cached like any other ISR page. With a dozen posts to a page there is no
// page 2 yet, and a build-time list would only go stale.
export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ locale: string; slug: string; page: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale, slug, page } = await params
  const n = parsePageParam(page)
  return n ? categoryMetadata(locale, slug, n) : {}
}

export default async function Page({ params }: Props) {
  const { locale, slug, page } = await params
  const n = parsePageParam(page)
  if (n === null) notFound()
  // One URL per page: /page/1 is the list itself.
  if (n === 1) permanentRedirect(`/${locale}/blog/category/${slug}`)
  return <CategoryView locale={locale} slug={slug} page={n} />
}
