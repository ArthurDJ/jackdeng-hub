/**
 * Formats an ISO date string into a locale-aware readable format.
 */
export function formatDate(iso: string, locale: string = 'en') {
  const date = new Date(iso)
  const lang = locale === 'zh' ? 'zh-CN' : 'en-US'
  
  return date.toLocaleDateString(lang, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
