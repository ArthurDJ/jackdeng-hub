import { getPayload } from '@/lib/payload'
import { CategoryView, categoryMetadata } from './view'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string; locale: string }> }

export async function generateStaticParams() {
  const payload = await getPayload()
  const { docs } = await payload.find({ collection: 'categories', limit: 200, depth: 0 })

  const paths = []
  for (const doc of docs) {
    for (const locale of ['en', 'zh']) {
      paths.push({ locale, slug: doc.slug })
    }
  }
  return paths
}

export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params
  return categoryMetadata(locale, slug, 1)
}

export default async function CategoryPage({ params }: Props) {
  const { slug, locale } = await params
  return <CategoryView locale={locale} slug={slug} page={1} />
}
