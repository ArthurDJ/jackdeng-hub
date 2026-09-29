import { refId, type Id, type PostTaxonomy } from './taxonomyCounts'

// Sitemap lastmod dates that say when a page's content last changed.
// Search engines only use lastmod while it stays accurate, and the sitemap
// stamped 17 of its 30 pages with the moment it was generated, so each
// regeneration claimed they had all just changed. Now a list page takes the
// newest date among what it lists, and a page with no date to go on (About,
// whose text is in the code) has no lastmod at all rather than a made-up one.

type When = string | null | undefined

/** The newest of some ISO timestamps, or undefined when there are none. */
export function latest(dates: When[]): string | undefined {
  let best: string | undefined
  let bestTime = -Infinity
  for (const d of dates) {
    const t = d ? Date.parse(d) : NaN
    if (!Number.isNaN(t) && t > bestTime) {
      best = d as string
      bestTime = t
    }
  }
  return best
}

/** A post changes when it is edited, not only when it is published. */
export function postModified(post: { updatedAt?: When; publishedAt?: When }): string | undefined {
  return latest([post.updatedAt, post.publishedAt])
}

/** The newest post date for each category id and each tag id. */
export function latestByTaxonomy(posts: (PostTaxonomy & { updatedAt?: When; publishedAt?: When })[]) {
  const categories = new Map<Id, string>()
  const tags = new Map<Id, string>()
  const bump = (map: Map<Id, string>, id: Id | undefined, when: string | undefined) => {
    if (id == null || !when) return
    const now = map.get(id)
    if (!now || Date.parse(when) > Date.parse(now)) map.set(id, when)
  }
  for (const post of posts) {
    const when = postModified(post)
    bump(categories, refId(post.category), when)
    for (const tag of post.tags ?? []) bump(tags, refId(tag), when)
  }
  return { categories, tags }
}
