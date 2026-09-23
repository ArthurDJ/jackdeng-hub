import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'always',
})

export type Locale = (typeof routing.locales)[number]

/**
 * Narrow a route param to a Locale. `[locale]/layout.tsx` already 404s on
 * anything else, so in a page the fallback never runs — it exists so the type
 * comes from a check rather than a cast. Payload's local API only accepts the
 * configured locale codes, which is what `locale as any` was hiding.
 */
export function asLocale(value: string): Locale {
  return (routing.locales as readonly string[]).includes(value)
    ? (value as Locale)
    : routing.defaultLocale
}
