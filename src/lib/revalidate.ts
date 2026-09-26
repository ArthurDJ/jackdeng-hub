import { revalidatePath, revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

// Every public page is cached for an hour (`revalidate = 3600`), the sitemap
// for a day, and nothing told those caches when content changed: a post
// published in /admin took up to an hour to appear. These hooks throw the
// caches away as soon as a change that visitors can see is saved.
//
// The whole site goes at once. It is a few dozen pages, each rebuilt on its
// next visit, and working out which pages a change touches (the home page, the
// sidebar on every blog page, the sitemap, search) is how one gets missed.

/** Tags on the two `unstable_cache` data caches, so the hooks can reach them. */
export const CACHE_TAGS = {
  sidebar: 'sidebar',
  search: 'search',
} as const

/**
 * Expire every cached page and data cache now. Both calls expire immediately
 * (no stale-while-revalidate): `revalidatePath` without a profile does, and so
 * does `revalidateTag` with `expire: 0`.
 */
export function revalidateSite(reason: string) {
  try {
    // '/' with 'layout' matches the implicit tag every route carries, pages
    // and the sitemap alike.
    revalidatePath('/', 'layout')
    // The search index is filled by /api/search, outside any page, so it has
    // to be reached by its own tag; the sidebar gets one too rather than
    // depending on which page happened to fill it first.
    revalidateTag(CACHE_TAGS.sidebar, { expire: 0 })
    revalidateTag(CACHE_TAGS.search, { expire: 0 })
  } catch (err) {
    // Outside a Next.js request there is no cache to expire: scripts run with
    // tsx (publish-drafts, CI's seed) land here. What they write shows up
    // when the hourly revalidation comes round, as before.
    console.warn(`[revalidate] skipped after ${reason}: ${err instanceof Error ? err.message : String(err)}`)
  }
}

type IsPublic = (doc: Record<string, unknown>) => boolean

/**
 * Expire the caches after a save. With `isPublic`, only when the document is
 * visible to visitors before or after the save: publishing, unpublishing and
 * editing a published post count, saving a draft does not.
 */
export function revalidateAfterChange(isPublic?: IsPublic): CollectionAfterChangeHook {
  return ({ doc, previousDoc, collection }) => {
    const visible = !isPublic || isPublic(doc) || (previousDoc != null && isPublic(previousDoc))
    if (visible) revalidateSite(`${collection.slug} ${doc.id} changed`)
    return doc
  }
}

/** Expire the caches after a delete, when the document was visible to visitors. */
export function revalidateAfterDelete(isPublic?: IsPublic): CollectionAfterDeleteHook {
  return ({ doc, collection }) => {
    if (!isPublic || isPublic(doc)) revalidateSite(`${collection.slug} ${doc.id} deleted`)
    return doc
  }
}
