import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: '.env' })
dotenvConfig({ path: '.env.local' })

import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function run() {
  console.log('Initializing payload...')
  const payload = await getPayload({ config: configPromise })

  const all = await payload.find({ collection: 'blogs', limit: 1000, depth: 0 })
  console.log(`Found ${all.docs.length} blog(s). Deleting...`)

  for (const blog of all.docs) {
    await payload.delete({ collection: 'blogs', id: blog.id })
    console.log(`  ✓ Deleted: ${blog.title}`)
  }

  const orphanComments = await payload.find({ collection: 'comments', limit: 1000, depth: 0 })
  for (const c of orphanComments.docs) {
    await payload.delete({ collection: 'comments', id: c.id })
  }
  console.log(`Cleared ${orphanComments.docs.length} orphan comment(s).`)

  console.log('Done.')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
