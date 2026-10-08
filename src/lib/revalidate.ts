import { revalidatePath, revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

// Every public page is cached for an hour (`revalidate = 3600`), and nothing
// told those caches when content changed: a post published in /admin took up
// to an hour to appear. These hooks throw the caches away as soon as a change
// that visitors can see is saved.
//
// The whole site goes at once. It is a few dozen pages, each rebuilt on its
// next visit, and working out which pages a change touches (the home page, the
// sidebar on every blog page, the sitemap, search) is how one gets missed.

/** Tags on the `unstable_cache` data caches, so the hooks can reach them. */
export const CACHE_TAGS = {
  sidebar: 'sidebar',
  search: 'search',
  sitemap: 'sitemap',
  feed: 'feed',
} as const

/**
 * Expire every cached page and data cache now. Every call expires immediately
 * (no stale-while-revalidate): `revalidatePath` without a profile does, and so
 * does `revalidateTag` with `expire: 0`. False when there was no cache to
 * reach.
 */
export function revalidateSite(reason: string): boolean {
  try {
    // '/' with 'layout' matches the implicit tag every page carries.
    revalidatePath('/', 'layout')
    // The search index is filled by /api/search, outside any page, so it has
    // to be reached by its own tag; the sidebar gets one too rather than
    // depending on which page happened to fill it first.
    revalidateTag(CACHE_TAGS.sidebar, { expire: 0 })
    revalidateTag(CACHE_TAGS.search, { expire: 0 })
    // The sitemap and the feed are route handlers, and on Vercel no path or
    // tag reaches a cached route handler response: on 2026-10-08 the same
    // call that answered REVALIDATED for /en left /sitemap.xml and
    // /feed.xml as HIT, though the sitemap carries the same `_N_T_/layout`
    // tag. So neither is cached as a response any more; each renders per
    // request from a data cache, and that cache is what gets expired here.
    revalidateTag(CACHE_TAGS.sitemap, { expire: 0 })
    revalidateTag(CACHE_TAGS.feed, { expire: 0 })
    return true
  } catch (err) {
    // Outside a Next.js request there is no cache to expire: scripts run with
    // tsx (publish-drafts, CI's seed) land here. The write scripts then ask
    // the live site to do it through POST /api/revalidate
    // (scripts/lib/refreshSite.ts).
    console.warn(`[revalidate] skipped after ${reason}: ${err instanceof Error ? err.message : String(err)}`)
    return false
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
