import { config as dotenvConfig } from 'dotenv'
import { getPayload } from 'payload'

// ESM hoists every static import above the statements in this file, so a
// top-level `import config from '../payload.config'` would be evaluated — and
// read process.env.DATABASE_URI — before dotenv ever runs, leaving the adapter
// pointed at localhost:5432. Load the env first, then pull the config in
// dynamically.
dotenvConfig({ path: '.env' })
dotenvConfig({ path: '.env.local' })

async function verify() {
  const config = (await import('../payload.config')).default
  const payload = await getPayload({ config })
  const cats = await payload.find({ collection: 'categories', limit: 20 })
  const tags = await payload.find({ collection: 'tags', limit: 50 })

  console.log(`\n=== Categories (${cats.totalDocs}) ===`)
  cats.docs.forEach((d: any) => console.log(` - ${d.name} [${d.slug}]`))

  console.log(`\n=== Tags (${tags.totalDocs}) ===`)
  tags.docs.forEach((d: any) => console.log(` - ${d.name} ${d.color} [${d.slug}]`))

  process.exit(0)
}

verify().catch(e => { console.error(e); process.exit(1) })
