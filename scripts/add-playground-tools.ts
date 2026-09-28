/**
 * Create the Playground tools that the database does not have yet, as
 * online, public, built-in records in both locales. Existing records are left
 * alone, so an edit made in /admin is never overwritten.
 *
 *   npx tsx scripts/add-playground-tools.ts            # read-only: print the plan
 *   npx tsx scripts/add-playground-tools.ts --apply    # write it
 *
 * Run it only after the deploy that registers the components is live;
 * otherwise /tools links to the "coming soon" placeholder. A record written
 * from a script does not expire the page cache (that hook needs Next.js), so
 * the tools appear on /tools within the hourly revalidation, or at once after
 * saving any tool in /admin.
 */
import { loadEnv, requireApply, describeTarget } from './lib/env'
import { PLAYGROUND_TOOLS } from './lib/playgroundTools'
import { getPayload } from 'payload'

loadEnv()

const apply = process.argv.includes('--apply')
if (apply) requireApply({ script: 'scripts/add-playground-tools.ts', writes: ['tools'] })

async function run() {
  const configPromise = (await import('../src/payload.config')).default
  const payload = await getPayload({ config: configPromise })
  console.log(`database: ${describeTarget().host}${apply ? '' : ' (read-only run)'}\n`)

  let missing = 0
  for (const tool of PLAYGROUND_TOOLS) {
    const { docs } = await payload.find({
      collection: 'tools', where: { slug: { equals: tool.slug } }, limit: 1, depth: 0, locale: 'en',
    })
    if (docs[0]) {
      console.log(`${tool.slug}: exists (id ${docs[0].id}, ${docs[0].status}), left alone`)
      continue
    }
    missing++
    console.log(`${tool.slug}: create ${tool.icon}`)
    console.log(`  en: ${tool.en.name}: ${tool.en.description}`)
    console.log(`  zh: ${tool.zh.name}：${tool.zh.description}`)
    if (!apply) continue
    const created = await payload.create({
      collection: 'tools',
      locale: 'en',
      data: { ...tool.en, slug: tool.slug, icon: tool.icon, accessControl: 'public', status: 'online', embedType: 'builtin' },
    })
    await payload.update({ collection: 'tools', id: created.id, locale: 'zh', data: tool.zh })
    console.log(`  written (id ${created.id})`)
  }
  if (!missing) console.log('\nNothing to create.')
  else console.log(apply ? '\nDone.' : `\n${missing} to create. Nothing written. Re-run with --apply to write.`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
