/**
 * Create project records that the database does not have yet, in both
 * locales. Existing slugs are left alone, so an edit made in /admin is never
 * overwritten.
 *
 * Text comes from markdown in $DRAFTS_DIR/projects/<slug>.<locale>.md: the
 * first paragraph becomes the short description, the rest the long one
 * (scripts/lib/markdown.ts turns it into Lexical).
 *
 *   DRAFTS_DIR=… npx tsx scripts/add-projects.ts            # read-only: print the plan
 *   DRAFTS_DIR=… npx tsx scripts/add-projects.ts --apply    # write it
 *
 * Records written from a script do not expire the page cache (that hook
 * needs Next.js); they show up within the hourly revalidation, or at once
 * after saving any project in /admin.
 */
import { loadEnv, requireApply, describeTarget } from './lib/env'
import { toLexical } from './lib/markdown'
import { getPayload } from 'payload'
import fs from 'fs'
import path from 'path'

loadEnv()

const DRAFTS = process.env.DRAFTS_DIR
if (!DRAFTS) {
  console.error('set DRAFTS_DIR to the folder holding projects/<slug>.<locale>.md')
  process.exit(1)
}

const apply = process.argv.includes('--apply')
if (apply) requireApply({ script: 'scripts/add-projects.ts', writes: ['projects'] })

type Locale = 'en' | 'zh'

const PROJECTS: {
  slug: string
  name: Record<Locale, string>
  madeAt: Record<Locale, string>
  year: string
  status: 'active' | 'completed' | 'on-hold'
  techStack: string[]
}[] = [
  {
    slug: 'data-hub',
    name: { en: 'DataHub', zh: 'DataHub 数据中台' },
    madeAt: { en: 'VWD', zh: 'VWD' },
    year: '2026–',
    status: 'active',
    techStack: ['.NET 10', 'ASP.NET Core', 'Dapper', 'EF Core', 'SQL Server', 'NetSuite SuiteQL', 'Hangfire', 'Vue 3'],
  },
  {
    slug: 'b2b-customer-portal',
    name: { en: 'B2B Customer Portal', zh: 'B2B 客户门户' },
    madeAt: { en: 'Viterra', zh: 'Viterra' },
    year: '2026–',
    status: 'active',
    techStack: ['.NET 10', 'ASP.NET Core', 'EF Core', 'SQL Server', 'React 19', 'NetSuite', 'GitHub Actions'],
  },
]

/** The draft file for a slug: its first paragraph and the rest. */
function draft(slug: string, locale: Locale) {
  const file = path.join(DRAFTS!, 'projects', `${slug}.${locale}.md`)
  const md = fs.readFileSync(file, 'utf8').trim()
  const cut = md.indexOf('\n\n')
  if (cut < 0) throw new Error(`${file}: needs a first paragraph and a body`)
  return { short: md.slice(0, cut).trim(), body: md.slice(cut).trim() }
}

async function run() {
  const configPromise = (await import('../src/payload.config')).default
  const payload = await getPayload({ config: configPromise })
  console.log(`database: ${describeTarget().host}${apply ? '' : ' (read-only run)'}\n`)

  let missing = 0
  for (const p of PROJECTS) {
    const { docs } = await payload.find({ collection: 'projects', where: { slug: { equals: p.slug } }, limit: 1, depth: 0, locale: 'en' })
    if (docs[0]) {
      console.log(`${p.slug}: exists (id ${docs[0].id}), left alone`)
      continue
    }
    missing++
    const en = draft(p.slug, 'en')
    const zh = draft(p.slug, 'zh')
    console.log(`${p.slug}: create (${p.status}, ${p.year}, not pinned)`)
    console.log(`  stack: ${p.techStack.join(', ')}`)
    for (const [locale, d] of [['en', en], ['zh', zh]] as const) {
      const sections = d.body.split('\n').filter((l) => l.startsWith('## ')).map((l) => l.slice(3))
      console.log(`  ${locale}: ${p.name[locale]} · made at ${p.madeAt[locale]}`)
      console.log(`      short: ${d.short}`)
      console.log(`      long: ${sections.length} sections (${sections.join(' / ')}), ${d.body.length} chars`)
    }
    if (!apply) continue
    const created = await payload.create({
      collection: 'projects',
      locale: 'en',
      data: {
        slug: p.slug,
        name: p.name.en,
        shortDescription: en.short,
        longDescription: toLexical(en.body) as any,
        madeAt: p.madeAt.en,
        year: p.year,
        status: p.status,
        isPinned: false,
        techStack: p.techStack.map((tech) => ({ tech })),
      },
    })
    await payload.update({
      collection: 'projects',
      id: created.id,
      locale: 'zh',
      data: { name: p.name.zh, shortDescription: zh.short, longDescription: toLexical(zh.body) as any, madeAt: p.madeAt.zh },
    })
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
