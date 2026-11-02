/**
 * Title and excerpt of an existing post against the values in
 * scripts/publish-drafts.ts, per locale. The script normally rewrites only the
 * body of a post that exists, so a title edited in /admin is not reverted;
 * with --meta it also writes these, and only the fields that differ.
 */

export type Locale = 'en' | 'zh'
export type MetaField = 'title' | 'excerpt'

/** What the database holds for one locale: values may be missing or null. */
export type StoredMeta = { title?: string | null; excerpt?: string | null } | null | undefined
export type WantedMeta = { title: string; excerpt: string }

export type MetaChange = { locale: Locale; field: MetaField; from: string | null; to: string }

const LOCALES: Locale[] = ['en', 'zh']
const FIELDS: MetaField[] = ['title', 'excerpt']

/**
 * Every field whose stored value differs from the wanted one, en before zh,
 * title before excerpt. An empty string counts as missing. Values are compared
 * exactly, so a change in whitespace or punctuation is a change.
 */
export function metaChanges(
  stored: Record<Locale, StoredMeta>,
  wanted: Record<Locale, WantedMeta>,
): MetaChange[] {
  const changes: MetaChange[] = []
  for (const locale of LOCALES) {
    for (const field of FIELDS) {
      const from = stored[locale]?.[field] || null
      const to = wanted[locale][field]
      if (from !== to) changes.push({ locale, field, from, to })
    }
  }
  return changes
}

/** The changed fields of one locale, as update data. Empty when nothing changed. */
export function metaData(changes: MetaChange[], locale: Locale): Partial<Record<MetaField, string>> {
  const data: Partial<Record<MetaField, string>> = {}
  for (const c of changes) if (c.locale === locale) data[c.field] = c.to
  return data
}

/** One dry-run line: `zh title: "old" → "new"`. */
export function describeMetaChange(c: MetaChange) {
  return `${c.locale} ${c.field}: ${c.from == null ? '(empty)' : JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`
}
