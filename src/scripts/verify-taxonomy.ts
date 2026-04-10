import { getPayload } from 'payload'
import config from '../payload.config'

async function verify() {
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
