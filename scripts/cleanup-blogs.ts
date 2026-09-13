import { config as dotenvConfig } from 'dotenv'
import { getPayload } from 'payload'

// ESM hoists every static import above the statements in this file, so a
// top-level `import configPromise from '../src/payload.config'` would be
// evaluated — and read process.env.DATABASE_URI — before dotenv ever runs,
// leaving the adapter pointed at localhost:5432. Load the env first, then
// pull the config in dynamically.
dotenvConfig({ path: '.env' })
dotenvConfig({ path: '.env.local' })

async function run() {
  console.log('Initializing payload...')
  const configPromise = (await import('../src/payload.config')).default
  const payload = await getPayload({ config: configPromise })

  // Delete comments first — comments.post_id is NOT NULL, so the FK ON DELETE
  // SET NULL would otherwise violate the constraint when the parent blog goes.
  const comments = await payload.find({ collection: 'comments', limit: 1000, depth: 0 })
  for (const c of comments.docs) {
    await payload.delete({ collection: 'comments', id: c.id })
  }
  console.log(`Cleared ${comments.docs.length} comment(s).`)

  const all = await payload.find({ collection: 'blogs', limit: 1000, depth: 0 })
  console.log(`Found ${all.docs.length} blog(s). Deleting...`)

  for (const blog of all.docs) {
    await payload.delete({ collection: 'blogs', id: blog.id })
    console.log(`  ✓ Deleted: ${blog.title}`)
  }

  console.log('Done.')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
