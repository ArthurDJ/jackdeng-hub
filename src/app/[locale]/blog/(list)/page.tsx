import { BlogListView, blogListMetadata } from './view'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  return blogListMetadata(locale, 1)
}

export default async function BlogListPage({ params }: Props) {
  const { locale } = await params
  return <BlogListView locale={locale} page={1} />
}
