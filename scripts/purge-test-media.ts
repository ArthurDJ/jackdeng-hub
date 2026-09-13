/**
 * One-off: remove the seed test images from the media library.
 *
 * The library was seeded with test-image-1..10.jpg by scripts/upload-test-images.ts
 * and they ended up being its only contents — enumerable by anyone via
 * `GET /api/media`, since Media.access.read is `() => true`.
 *
 * Run a dry run first (default), then pass --apply to actually delete:
 *   npx tsx scripts/purge-test-media.ts
 *   npx tsx scripts/purge-test-media.ts --apply
 *
 * Refuses to delete anything still referenced by a blog cover or a project,
 * and only ever touches filenames matching TEST_FILENAME.
 */
import { config as dotenvConfig } from 'dotenv'
import { getPayload } from 'payload'

// ESM hoists every static import above the statements in this file, so a
// top-level `import configPromise from '../src/payload.config'` would be
// evaluated — and read process.env.DATABASE_URI — before dotenv ever runs,
// leaving the adapter pointed at localhost:5432. Load the env first, then
// pull the config in dynamically.
dotenvConfig({ path: '.env' })
dotenvConfig({ path: '.env.local' })

const TEST_FILENAME = /^test-image-\d+\.jpg$/i

async function run() {
  const apply = process.argv.includes('--apply')
  const configPromise = (await import('../src/payload.config')).default
  const payload = await getPayload({ config: configPromise })

  const media = await payload.find({ collection: 'media', limit: 1000, depth: 0 })
  const targets = media.docs.filter((m: any) => TEST_FILENAME.test(m.filename ?? ''))
  const kept = media.docs.length - targets.length

  console.log(`media library: ${media.docs.length} doc(s) — ${targets.length} match, ${kept} untouched`)
  if (!targets.length) {
    console.log('nothing to do.')
    return
  }

  // ── Referential safety check ────────────────────────────────────────────
  const ids = new Set(targets.map((m: any) => String(m.id)))
  const referenced = new Map<string, string[]>()

  const note = (id: string, where: string) => {
    referenced.set(id, [...(referenced.get(id) ?? []), where])
  }

  const blogs = await payload.find({ collection: 'blogs', limit: 1000, depth: 0 })
  for (const b of blogs.docs as any[]) {
    if (b.coverImage && ids.has(String(b.coverImage))) note(String(b.coverImage), `blog "${b.title}"`)
  }

  const projects = await payload.find({ collection: 'projects', limit: 1000, depth: 0 })
  for (const p of projects.docs as any[]) {
    for (const field of ['coverImage', 'thumbnail', 'image'] as const) {
      const v = (p as any)[field]
      if (v && ids.has(String(v))) note(String(v), `project "${p.title}" (${field})`)
    }
  }

  if (referenced.size) {
    console.error('\nrefusing to delete — still referenced:')
    for (const [id, where] of referenced) console.error(`  ${id}: ${where.join(', ')}`)
    process.exitCode = 1
    return
  }
  console.log('no blog or project references any of them.')

  // ── Delete ──────────────────────────────────────────────────────────────
  if (!apply) {
    console.log('\ndry run — would delete:')
    for (const m of targets as any[]) console.log(`  ${m.id}  ${m.filename}`)
    console.log('\nre-run with --apply to actually delete.')
    return
  }

  for (const m of targets as any[]) {
    await payload.delete({ collection: 'media', id: m.id })
    console.log(`  deleted ${m.filename}`)
  }
  console.log(`\ndone — ${targets.length} deleted.`)
}

run()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
