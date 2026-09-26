// How many published posts each category and tag has, so the sidebar and the
// sitemap can leave out the ones with none. The taxonomy was seeded up front
// (6 categories, 20 tags) and most of it had no posts yet: the sidebar listed
// four categories at 0 and sixteen tags that led to "no posts found", and the
// sitemap sent search engines to all of those empty pages.

type Id = number | string
type Ref = Id | { id: Id } | null | undefined

export interface PostTaxonomy {
  category?: Ref
  tags?: Ref[] | null
}

function refId(ref: Ref): Id | undefined {
  if (ref == null) return undefined
  return typeof ref === 'object' ? ref.id : ref
}

/** Posts per category id and per tag id. Takes relations at depth 0 or populated. */
export function countPostsByTaxonomy(posts: PostTaxonomy[]) {
  const categories = new Map<Id, number>()
  const tags = new Map<Id, number>()
  for (const post of posts) {
    const category = refId(post.category)
    if (category != null) categories.set(category, (categories.get(category) ?? 0) + 1)
    // A tag listed twice on one post still counts that post once.
    for (const tag of new Set((post.tags ?? []).map(refId))) {
      if (tag != null) tags.set(tag, (tags.get(tag) ?? 0) + 1)
    }
  }
  return { categories, tags }
}

/** The items with at least one post, most-used first. Ties keep their input order. */
export function withPosts<T extends { id: Id }>(
  items: T[],
  counts: Map<Id, number>,
): (T & { _count: number })[] {
  return items
    .map((item) => ({ ...item, _count: counts.get(item.id) ?? 0 }))
    .filter((item) => item._count > 0)
    .sort((a, b) => b._count - a._count)
}
