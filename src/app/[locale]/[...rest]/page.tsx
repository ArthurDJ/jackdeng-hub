import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

// Any path under a locale that no route claims: /en/nope, /zh/a/b, an old
// link. Without this, Next has no [locale] route to hand the 404 to and falls
// back to the root src/app/not-found.tsx: an untranslated dark page with no
// navbar and no theme, since it sits outside the locale layout. Calling
// notFound() here renders [locale]/not-found.tsx inside that layout instead,
// still with a 404 status.
type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'notFound' })
  return { title: t('title'), robots: { index: false } }
}

export default function UnmatchedPath() {
  notFound()
}
