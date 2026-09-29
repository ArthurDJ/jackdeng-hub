// Dates in the page's language. Every date on the site goes through here, so
// the two locales cannot drift into different formats (the sidebar archive
// used to read "2026年九月" while the archive page said "九月").

/** The BCP 47 tag Intl formatters take for a site locale. */
export function intlLocale(locale: string) {
  return locale === 'zh' ? 'zh-CN' : 'en-US'
}
const lang = intlLocale

/** An instant as a readable day: "Sep 14, 2026" / "2026年9月14日". */
export function formatDate(iso: string, locale: string = 'en') {
  return new Date(iso).toLocaleDateString(lang(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// A calendar month, not an instant, so both of these format in UTC: in local
// time the first of a month is still the previous month west of Greenwich.

/** A calendar day written YYYY-MM-DD: "Sep 22, 2026" / "2026年9月22日". */
export function formatDay(ymd: string, locale: string = 'en') {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString(lang(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/** "September 2026" / "2026年9月". */
export function formatMonth(year: number, month: number, locale: string = 'en') {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(lang(locale), {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

/** "September" / "九月", for a month shown under its year's heading. */
export function formatMonthName(month: number, locale: string = 'en') {
  return new Date(Date.UTC(2000, month - 1, 1)).toLocaleDateString(lang(locale), {
    month: 'long',
    timeZone: 'UTC',
  })
}
