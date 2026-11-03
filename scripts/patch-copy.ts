/**
 * Small copy fixes in the database, with a read-only plan that prints every
 * change as old → new. Category descriptions (both locales) and post titles
 * (English, where three ran past the 60 characters search results show).
 *
 *   npx tsx scripts/patch-copy.ts            # read-only: print the plan
 *   npx tsx scripts/patch-copy.ts --apply    # write it
 *
 * Fields already at their target value are skipped, so running twice is
 * harmless. Post titles here must match their entries in publish-drafts.ts,
 * or a later `publish-drafts.ts --meta` run would put the old ones back.
 */
import { loadEnv, requireApply, describeTarget } from './lib/env'
import { refreshLiveSite } from './lib/refreshSite'
import { getPayload } from 'payload'

loadEnv()

const apply = process.argv.includes('--apply')
if (apply) requireApply({ script: 'scripts/patch-copy.ts', writes: ['categories', 'blogs'] })

type Locale = 'en' | 'zh'

// "Backend" still promised GraphQL, which has been off since #74; the other
// two had none, so their pages fell back to "Posts in the … category."
const CATEGORY_DESCRIPTIONS: Record<string, Record<Locale, string>> = {
  backend: {
    en: 'Server-side work: APIs, integrations, and the AI tools wired into them.',
    zh: '服务端的活：API、系统集成，还有接进系统里的 AI 工具。',
  },
  'full-stack': {
    en: 'How this site and other apps are built end to end: architecture, deployment, performance.',
    zh: '这个网站和其他应用是怎么做出来的：架构、部署、性能。',
  },
  data: {
    en: 'Data platforms and pipelines: SQL, dbt, Databricks, and what breaks in migrations.',
    zh: '数据平台和管道：SQL、dbt、Databricks，以及迁移里会出的错。',
  },
}

const POST_TITLES_EN: Record<string, string> = {
  'the-redirect-i-explained-away': 'The redirect I explained away: mobile LCP 3.8 s → 2.2 s',
  'astrbot-deepseek-wechat': 'My DeepSeek "fat fish" bot only talks to me',
  'from-sql-server-to-databricks': 'Migration notes said "off by at most one." It was two days.',
}

const show = (v: unknown) => (v == null || v === '' ? '(empty)' : JSON.stringify(v))

async function run() {
  const configPromise = (await import('../src/payload.config')).default
  const payload = await getPayload({ config: configPromise })
  console.log(`database: ${describeTarget().host}${apply ? '' : ' (read-only run)'}\n`)

  let changes = 0
  const one = async (collection: 'categories' | 'blogs', slug: string, locale: Locale) =>
    (await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, locale })).docs[0] as any

  for (const [slug, byLocale] of Object.entries(CATEGORY_DESCRIPTIONS)) {
    for (const locale of ['en', 'zh'] as const) {
      const doc = await one('categories', slug, locale)
      if (!doc) throw new Error(`category ${slug}: not found`)
      if (doc.description === byLocale[locale]) continue
      console.log(`category ${slug} ${locale}.description: ${show(doc.description)} → ${show(byLocale[locale])}`)
      changes++
      if (apply) await payload.update({ collection: 'categories', id: doc.id, locale, data: { description: byLocale[locale] } })
    }
  }

  for (const [slug, title] of Object.entries(POST_TITLES_EN)) {
    const doc = await one('blogs', slug, 'en')
    if (!doc) throw new Error(`post ${slug}: not found`)
    if (doc.title === title) continue
    console.log(`post ${slug} en.title (${doc.title.length} → ${title.length}): ${show(doc.title)} → ${show(title)}`)
    changes++
    if (apply) await payload.update({ collection: 'blogs', id: doc.id, locale: 'en', data: { title } })
  }

  console.log(apply ? `\n${changes} written.` : changes ? `\n${changes} changes. Nothing written. Re-run with --apply to write.` : '\nNothing to change.')
  if (apply && changes) await refreshLiveSite({ isProduction: describeTarget().isProduction })
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
