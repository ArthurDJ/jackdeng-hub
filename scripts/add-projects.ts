/**
 * Create project records that the database does not have yet, in both
 * locales. Existing slugs are left alone, so an edit made in /admin is never
 * overwritten.
 *
 * Text comes from markdown in $DRAFTS_DIR/projects/<slug>.<locale>.md: the
 * first paragraph becomes the short description, the rest the long one
 * (scripts/lib/markdown.ts turns it into Lexical).
 *
 * A record is written in two calls, English then Chinese. If the second one
 * failed, a re-run finds the record with no Chinese name or short description
 * and writes the Chinese half again; anything else on an existing record is
 * left alone.
 *
 *   DRAFTS_DIR=… npx tsx scripts/add-projects.ts            # read-only: print the plan
 *   DRAFTS_DIR=… npx tsx scripts/add-projects.ts --apply    # write it
 *
 * After writing it asks the live site to expire its caches
 * (scripts/lib/refreshSite.ts, which needs REVALIDATE_SECRET); script writes
 * cannot do that themselves.
 */
import { loadEnv, requireApply, describeTarget } from './lib/env'
import { refreshLiveSite } from './lib/refreshSite'
import { toLexical } from './lib/markdown'
import { readDraft } from './lib/drafts'
import { getPayload } from 'payload'

loadEnv()

if (!process.env.DRAFTS_DIR) {
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
  isPinned?: boolean
  githubLink?: string
  /** Lower comes first on /projects (src/lib/projectOrder.ts); 0 when left out. */
  sortOrder?: number
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
  // Like the two above: no company name in the name, slug or text.
  {
    slug: 'order-tracking-portal',
    name: { en: 'Order Tracking Portal', zh: '订单查询门户' },
    madeAt: { en: 'VWD', zh: 'VWD' },
    year: '2026–',
    status: 'active',
    techStack: ['.NET 10', 'ASP.NET Core', 'Dapper', 'EF Core', 'SQL Server', 'Vue 3', 'Reka UI', 'Playwright'],
    isPinned: true,
  },
  // Two Claude skills of mine, public on GitHub under the MIT license. Listed
  // after the work projects, which are 0.
  {
    slug: 'rental-search',
    name: { en: 'Rental Search Skill for Claude', zh: '租房搜索 Claude skill' },
    madeAt: { en: 'Personal', zh: '个人项目' },
    year: '2026–',
    status: 'active',
    techStack: ['Claude Agent Skills', 'Markdown', 'Python', 'openpyxl', 'GitHub Actions'],
    githubLink: 'https://github.com/ArthurDJ/rental-search',
    sortOrder: 10,
  },
  {
    slug: 'flight-trip-planning',
    name: { en: 'Flight Planning Skill for Claude', zh: '机票规划 Claude skill' },
    madeAt: { en: 'Personal', zh: '个人项目' },
    year: '2026–',
    status: 'active',
    techStack: ['Claude Agent Skills', 'Markdown', 'Python', 'GitHub Actions'],
    githubLink: 'https://github.com/ArthurDJ/flight-trip-planning',
    sortOrder: 10,
  },
]

async function run() {
  const configPromise = (await import('../src/payload.config')).default
  const payload = await getPayload({ config: configPromise })
  console.log(`database: ${describeTarget().host}${apply ? '' : ' (read-only run)'}\n`)

  const writeZh = (id: number, p: (typeof PROJECTS)[number], zh: ReturnType<typeof readDraft>) =>
    payload.update({
      collection: 'projects',
      id,
      locale: 'zh',
      data: { name: p.name.zh, shortDescription: zh.short, longDescription: toLexical(zh.body) as any, madeAt: p.madeAt.zh },
    })

  let missing = 0
  for (const p of PROJECTS) {
    // `select` keeps these reads to columns every deployed schema has.
    const { docs } = await payload.find({
      collection: 'projects', where: { slug: { equals: p.slug } }, limit: 1, depth: 0, locale: 'en', select: { slug: true },
    })
    if (docs[0]) {
      const id = docs[0].id
      const zhDoc = await payload.findByID({
        collection: 'projects', id, locale: 'zh', fallbackLocale: false, depth: 0, select: { name: true, shortDescription: true },
      })
      if (zhDoc.name && zhDoc.shortDescription) {
        console.log(`${p.slug}: exists (id ${id}), left alone`)
        continue
      }
      missing++
      console.log(`${p.slug}: exists (id ${id}) without its Chinese name or short description; write the Chinese half`)
      if (apply) {
        await writeZh(id, p, readDraft(p.slug, 'zh'))
        console.log(`  written (id ${id}, zh)`)
      }
      continue
    }
    missing++
    const en = readDraft(p.slug, 'en')
    const zh = readDraft(p.slug, 'zh')
    console.log(`${p.slug}: create (${p.status}, ${p.year}, ${p.isPinned ? 'pinned' : 'not pinned'}, order ${p.sortOrder ?? 0})`)
    console.log(`  stack: ${p.techStack.join(', ')}`)
    if (p.githubLink) console.log(`  github: ${p.githubLink}`)
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
        isPinned: p.isPinned ?? false,
        githubLink: p.githubLink,
        sortOrder: p.sortOrder ?? 0,
        techStack: p.techStack.map((tech) => ({ tech })),
      },
    })
    await writeZh(created.id, p, zh)
    console.log(`  written (id ${created.id})`)
  }
  if (!missing) console.log('\nNothing to write.')
  else console.log(apply ? '\nDone.' : `\n${missing} to write. Nothing written. Re-run with --apply to write.`)
  if (apply && missing) await refreshLiveSite({ isProduction: describeTarget().isProduction })
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
