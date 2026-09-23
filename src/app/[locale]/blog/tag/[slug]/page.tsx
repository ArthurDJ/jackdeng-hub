import { getPayload } from '@/lib/payload'
import { TagView, tagMetadata } from './view'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string; locale: string }> }

export async function generateStaticParams() {
  const payload = await getPayload()
  const { docs } = await payload.find({ collection: 'tags', limit: 500, depth: 0 })

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
  return tagMetadata(locale, slug, 1)
}

export default async function TagPage({ params }: Props) {
  const { slug, locale } = await params
  return <TagView locale={locale} slug={slug} page={1} />
}
