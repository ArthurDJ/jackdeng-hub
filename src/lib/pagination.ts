// Page numbers for /…/page/[page] routes. Pagination used to ride on
// ?page=N, and reading searchParams made every list page render per request;
// a path segment lets the pages be cached like the rest of the site.

export const POSTS_PER_PAGE = 12

/**
 * The page number a `[page]` segment names, or null if it does not name one.
 * Strict on purpose: "02", "2.0", "+2" and "0" would otherwise each be a
 * second URL for the same content (or for nothing), and every one of them
 * would be cached. Page 1 is valid here; the route redirects it to the
 * unnumbered URL.
 */
export function parsePageParam(raw: string): number | null {
  if (!/^[1-9]\d{0,5}$/.test(raw)) return null
  return Number(raw)
}

/** Where page `p` of a list lives: page 1 is the list itself. */
export function pageHref(basePath: string, p: number): string {
  return p <= 1 ? basePath : `${basePath}/page/${p}`
}
