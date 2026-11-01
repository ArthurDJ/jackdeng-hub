// The pure half of the admin dashboard overview (src/components/AdminOverview.tsx):
// which language its text is in, where each figure links to, and how a
// failed query degrades. The component itself needs a live Payload instance.

/** The admin UI languages, as Payload's `i18n.language` reports them. */
export type AdminLanguage = 'en' | 'zh'

/** A string in both admin languages, in the `{ en, zh }` shape the collection configs use for labels. */
export type AdminText = Record<AdminLanguage, string>

/**
 * The admin UI language, defaulting to Chinese like the admin itself
 * (`i18n.fallbackLanguage` in payload.config.ts). Payload reports bare codes,
 * but a region-tagged `en-US` is still English.
 */
export function adminLanguage(language: string | null | undefined): AdminLanguage {
  return language?.toLowerCase().split(/[-_]/)[0] === 'en' ? 'en' : 'zh'
}

/** `/admin` + `/collections/blogs` without a doubled or missing slash. */
function adminPath(adminRoute: string, path: string): string {
  return `${adminRoute.replace(/\/+$/, '')}${path}`
}

/**
 * A collection's list view, optionally filtered by `field equals value`:
 * `/admin/collections/blogs?where[status][equals]=draft`. The brackets stay
 * literal (the list view parses either form); field and value are encoded.
 */
export function adminListUrl(adminRoute: string, collection: string, equals?: Record<string, string>): string {
  const base = adminPath(adminRoute, `/collections/${collection}`)
  const filters = Object.entries(equals ?? {}).map(
    ([field, value]) => `where[${encodeURIComponent(field)}][equals]=${encodeURIComponent(value)}`,
  )
  return filters.length ? `${base}?${filters.join('&')}` : base
}

/** A collection's create view: `/admin/collections/media/create`. */
export function adminCreateUrl(adminRoute: string, collection: string): string {
  return adminPath(adminRoute, `/collections/${collection}/create`)
}

/** One document's edit view: `/admin/collections/blogs/42`. */
export function adminEditUrl(adminRoute: string, collection: string, id: number | string): string {
  return adminPath(adminRoute, `/collections/${collection}/${encodeURIComponent(String(id))}`)
}

/**
 * Resolve to `null` instead of rejecting, logging why. The overview is a
 * secondary block on top of the dashboard: one failed count shows a dash, it
 * must not take the collection list below it down too. Same idea as
 * `orEmpty` in src/lib/payload.ts, for queries that are not a list of docs.
 */
export function orNull<T>(query: Promise<T>, context: string): Promise<T | null> {
  return query.catch((err: unknown) => {
    console.error(`[orNull] ${context}: query failed, rendering the figure empty`, err)
    return null
  })
}
