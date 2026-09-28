/**
 * Ordering and link text for the project archive table (/projects/archive).
 *
 * `year` is free text an editor types, e.g. "2024", "2022–2023" or
 * "2024–present". Rows sort by the latest year they mention, newest first;
 * a range left open ("2024–", "至今", "present") counts as ongoing and goes
 * to the top. Rows with no year go last, and ties keep the newest record
 * first.
 */

const ONGOING = /(?:[-–—]\s*$|present|now|至今|现在)/i

export function yearKey(year?: string | null): number | null {
  if (!year?.trim()) return null
  if (ONGOING.test(year.trim())) return Number.POSITIVE_INFINITY
  const years = year.match(/\d{4}/g)
  return years ? Math.max(...years.map(Number)) : null
}

export function sortArchive<T extends { year?: string | null; createdAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const ka = yearKey(a.year)
    const kb = yearKey(b.year)
    if (ka !== kb) {
      if (ka === null) return 1
      if (kb === null) return -1
      return kb - ka
    }
    return b.createdAt.localeCompare(a.createdAt)
  })
}

/** "https://www.github.com/a/b/" → "github.com/a/b". */
export function linkLabel(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '')
}
