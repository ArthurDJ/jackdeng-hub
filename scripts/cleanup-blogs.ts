import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: '.env' })
dotenvConfig({ path: '.env.local' })

import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function run() {
  console.log('Initializing payload...')
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
