/**
 * Give the four launch posts tags that match what they are about, and take
 * two of them back to draft.
 *
 * The posts went out with tags picked from the seeded list rather than from
 * their content: a piece on the EU AI Act tagged REST API, one on systems
 * engineering tagged PostgreSQL, one tagged NetSuite and Boomi that names
 * neither. The two AI-news roundups (three dates, agent keys) go back to
 * draft, not deleted, until they are rewritten or dropped; they get their new
 * tags too, so they are right if they come back.
 *
 *   npx tsx scripts/retag-posts.ts           # read-only: print what would change
 *   npx tsx scripts/retag-posts.ts --apply   # write it
 *
 * Writing from here skips the cache revalidation hooks (no Next.js request),
 * so the pages catch up on the next deploy or within the hour.
 */
import { loadEnv, requireApply, describeTarget } from './lib/env'
import { getPayload } from 'payload'

loadEnv()
const apply = process.argv.includes('--apply')
if (apply) requireApply({ script: 'scripts/retag-posts.ts', writes: ['tags', 'blogs'] })

const NEW_TAGS = [
  { slug: 'ai', name: 'AI', color: '#8B5CF6' },
  { slug: 'security', name: 'Security', color: '#EF4444' },
  { slug: 'systems-engineering', name: 'Systems Engineering', color: '#10B981' },
  { slug: 'data-engineering', name: 'Data Engineering', color: '#F59E0B' },
]

const POSTS: { slug: string; tags: string[]; status?: 'draft' }[] = [
  { slug: 'the-last-mile-is-not-the-model', tags: ['ai', 'rest-api'] },
  { slug: 'three-ideas-from-systems-engineering', tags: ['systems-engineering', 'data-engineering'] },
  { slug: 'three-dates-worth-checking', tags: ['ai'], status: 'draft' },
  { slug: 'before-you-give-an-agent-a-key', tags: ['ai', 'security'], status: 'draft' },
]

async function run() {
  console.log(`${apply ? 'APPLY' : 'DRY RUN (read-only)'} against ${describeTarget().host}\n`)
  const config = (await import('../src/payload.config')).default
  const payload = await getPayload({ config })

  // Tags: create the missing ones.
  const tagId = new Map<string, number>()
  for (const tag of NEW_TAGS) {
    const { docs } = await payload.find({ collection: 'tags', where: { slug: { equals: tag.slug } }, limit: 1, depth: 0 })
    if (docs[0]) {
      tagId.set(tag.slug, docs[0].id)
      console.log(`tag ${tag.slug}: exists`)
    } else if (apply) {
      const created = await payload.create({ collection: 'tags', data: tag })
      tagId.set(tag.slug, created.id)
      console.log(`tag ${tag.slug}: created (id ${created.id})`)
    } else {
      console.log(`tag ${tag.slug}: would create "${tag.name}"`)
    }
  }
  const wanted = new Set(POSTS.flatMap((p) => p.tags))
  for (const slug of wanted) {
    if (tagId.has(slug) || NEW_TAGS.some((t) => t.slug === slug)) continue
    const { docs } = await payload.find({ collection: 'tags', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    if (!docs[0]) throw new Error(`tag ${slug} does not exist`)
    tagId.set(slug, docs[0].id)
  }

  // Posts: tags, and status where it changes.
  console.log('')
  for (const post of POSTS) {
    const { docs } = await payload.find({
      collection: 'blogs', where: { slug: { equals: post.slug } }, limit: 1, depth: 1, locale: 'en',
    })
    const doc = docs[0]
    if (!doc) throw new Error(`post ${post.slug} not found`)
    const before = (doc.tags ?? []).map((t) => (typeof t === 'object' ? t.slug : `#${t}`))
    const status = post.status ?? doc.status
    console.log(`${post.slug}`)
    console.log(`  tags:   [${before.join(', ')}] → [${post.tags.join(', ')}]`)
    console.log(`  status: ${doc.status}${status !== doc.status ? ` → ${status}` : ' (unchanged)'}`)
    if (!apply) continue
    await payload.update({
      collection: 'blogs',
      id: doc.id,
      locale: 'en',
      data: { tags: post.tags.map((s) => tagId.get(s)!), status },
    })
    console.log('  written')
  }
  console.log(apply ? '\nDone.' : '\nNothing written. Re-run with --apply to write.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
