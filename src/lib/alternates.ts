import { routing } from '../i18n/routing'

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

/**
 * `alternates` metadata for a page that exists in every locale at the same
 * path: its own URL as canonical, and one hreflang link per locale.
 *
 * `path` is locale-less and starts with "/" ("/blog/tag/go/page/2"), or is
 * "" for the home page.
 */
export function localeAlternates(locale: string, path: string, base: string = BASE) {
  return {
    canonical: `${base}/${locale}${path}`,
    languages: Object.fromEntries(routing.locales.map((l) => [l, `${base}/${l}${path}`])),
  }
}
