import { getTranslations } from 'next-intl/server'
import { profileOgImage } from './profile'

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

/**
 * The Open Graph block for a page without a share card of its own: the
 * profile card, with the headline in the page's language. The layout uses it
 * as the default. A page that sets `openGraph` replaces the layout's whole,
 * so a page that only needs to add its `url` spreads this in first.
 */
export async function siteOpenGraph(locale: string) {
  const t = await getTranslations({ locale, namespace: 'home' })
  return {
    siteName: 'Jack Deng',
    images: [{ url: profileOgImage(BASE, t('title')), width: 1200, height: 630 }],
  }
}
