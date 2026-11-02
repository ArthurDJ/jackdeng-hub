import type { Where } from 'payload'

/**
 * The tools a visitor may see: online and public. The collection's read
 * access, the /tools list, /uses, the sitemap and the search index all filter
 * with this, so none of them can list a tool another one hides; they used to
 * spell the two conditions out five times. The tool page itself also shows
 * tools under maintenance (tools/[slug]/page.tsx), on purpose.
 *
 * A function, not a shared object: the result goes into Payload queries and
 * is the collection's access rule, so nothing a caller or Payload does to it
 * can carry over to the next request.
 */
export function listedTools(): Where {
  return { and: [{ status: { equals: 'online' } }, { accessControl: { equals: 'public' } }] }
}
