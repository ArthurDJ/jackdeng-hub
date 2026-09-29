/**
 * Field-level edits to existing project records, in both locales, with a
 * read-only plan that prints every change as old → new.
 *
 *   DRAFTS_DIR=… npx tsx scripts/patch-projects.ts            # read-only: print the plan
 *   DRAFTS_DIR=… npx tsx scripts/patch-projects.ts --apply    # write it
 *
 * Each patch finds its record by `slug`, or by the new slug when it renames
 * one that was already renamed. Fields already at their target value are
 * skipped, so running twice is harmless. A long-description edit replaces one exact
 * sentence and fails if that sentence is not found exactly once. A patch
 * with `fromDraft` rewrites both descriptions from
 * $DRAFTS_DIR/projects/<slug>.<locale>.md (scripts/lib/drafts.ts); DRAFTS_DIR
 * is only needed for those.
 *
 * Script writes do not expire the page cache (that hook needs Next.js):
 * changes show within the hourly revalidation, or at once after saving any
 * project in /admin.
 */
import { loadEnv, requireApply, describeTarget } from './lib/env'
import { readDraft } from './lib/drafts'
import { toLexical } from './lib/markdown'
import { getPayload } from 'payload'
import { isDeepStrictEqual } from 'util'

loadEnv()

const apply = process.argv.includes('--apply')
if (apply) requireApply({ script: 'scripts/patch-projects.ts', writes: ['projects'] })

type Locale = 'en' | 'zh'
type Localized = Partial<{ name: string; shortDescription: string; madeAt: string }>

interface Patch {
  slug: string
  set?: Partial<{ slug: string; year: string; isPinned: boolean }>
  locales?: Partial<Record<Locale, Localized>>
  /** Both descriptions, in both locales, from the markdown draft. */
  fromDraft?: boolean
  /** Exact sentences in the long description, and what replaces each. */
  replaceInLong?: Partial<Record<Locale, [string, string][]>>
}

const PATCHES: Patch[] = [
  {
    slug: 'enterprise-manufacturing-analytics',
    set: { year: '2024–' },
    locales: { en: { madeAt: 'VWD' }, zh: { madeAt: 'VWD' } },
    replaceInLong: {
      en: [
        ['Took part in the architecture design and deployment of the platform.', "Took part in the platform's architecture design and built part of it."],
        // The dbt project has no snapshots; the tests are real.
        ['Data-quality tests and snapshots for slowly changing dimensions.', 'Data-quality tests.'],
      ],
      zh: [
        ['参与平台的架构设计与部署。', '参与平台的架构设计，并搭建了其中一部分。'],
        ['数据质量测试，并使用 snapshot 处理缓慢变化维度。', '数据质量测试。'],
      ],
    },
  },
  // The old text claimed things that stopped being true: no client-side JS,
  // sub-200 ms TTFB (never measured), self-hosted, REST/GraphQL (GraphQL has
  // been off since #74).
  {
    slug: 'jackdeng-hub',
    set: { year: '2026–' },
    locales: { en: { madeAt: 'Personal' }, zh: { madeAt: '个人项目' } },
    fromDraft: true,
  },
  // The two work systems carry no company name in their name, URL or text;
  // "made at" still says where.
  {
    slug: 'vwd-datahub',
    set: { slug: 'data-hub', isPinned: true },
    locales: { en: { name: 'DataHub', madeAt: 'VWD' }, zh: { name: 'DataHub 数据中台', madeAt: 'VWD' } },
  },
  {
    slug: 'viterra-customer-portal',
    set: { slug: 'b2b-customer-portal', isPinned: true },
    locales: {
      en: {
        name: 'B2B Customer Portal',
        shortDescription: 'A B2B portal for customers, backed by NetSuite. Deployed to a company server in September 2026 and used internally; not yet open to customers.',
      },
      zh: {
        name: 'B2B 客户门户',
        shortDescription: '给客户用的 B2B 门户，后面接 NetSuite。2026 年 9 月部署到公司服务器，目前内部在用，还没开放给客户。',
      },
    },
  },
]

/** Replace `from` with `to` in the one Lexical text node that contains it. */
function replaceSentence(doc: any, from: string, to: string): any {
  const copy = JSON.parse(JSON.stringify(doc))
  let hits = 0
  const walk = (n: any) => {
    if (typeof n?.text === 'string' && n.text.includes(from)) {
      n.text = n.text.replace(from, to)
      hits++
    }
    for (const c of n?.children ?? []) walk(c)
  }
  walk(copy.root)
  if (hits !== 1) throw new Error(`expected "${from}" once in the long description, found ${hits}`)
  return copy
}

const show = (v: unknown) => (v == null || v === '' ? '(empty)' : JSON.stringify(v))

/** The text of a Lexical document, for sizing it in the plan. */
function plainText(doc: any): string {
  const out: string[] = []
  const walk = (n: any) => {
    if (typeof n?.text === 'string') out.push(n.text)
    for (const c of n?.children ?? []) walk(c)
  }
  walk(doc?.root)
  return out.join('')
}

async function run() {
  const configPromise = (await import('../src/payload.config')).default
  const payload = await getPayload({ config: configPromise })
  console.log(`database: ${describeTarget().host}${apply ? '' : ' (read-only run)'}\n`)

  const find = async (slug: string, locale: Locale) =>
    (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, locale })).docs[0]

  let changes = 0
  for (const p of PATCHES) {
    // A patch that renames the slug may already have run: carry on with the
    // rest of it under the new slug.
    let slug = p.slug
    let en = await find(slug, 'en')
    if (!en && p.set?.slug) {
      slug = p.set.slug
      en = await find(slug, 'en')
    }
    if (!en) throw new Error(`${p.slug}: not found`)
    console.log(`${slug} (id ${en.id})${slug === p.slug ? '' : ` (was ${p.slug})`}`)
    const shared: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(p.set ?? {})) {
      if ((en as any)[k] === v) continue
      console.log(`  ${k}: ${show((en as any)[k])} → ${show(v)}`)
      shared[k] = v
    }
    const perLocale: Partial<Record<Locale, Record<string, unknown>>> = {}
    for (const locale of ['en', 'zh'] as const) {
      const doc = locale === 'en' ? en : await find(slug, locale)
      const data: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(p.locales?.[locale] ?? {})) {
        if ((doc as any)[k] === v) continue
        console.log(`  ${locale}.${k}: ${show((doc as any)[k])} → ${show(v)}`)
        data[k] = v
      }
      let long = doc.longDescription
      if (p.fromDraft) {
        const d = readDraft(slug, locale)
        if (doc.shortDescription !== d.short) {
          console.log(`  ${locale}.shortDescription: ${show(doc.shortDescription)} → ${show(d.short)}`)
          data.shortDescription = d.short
        }
        // Compared as values: Postgres jsonb does not keep key order.
        const lexical = toLexical(d.body) as any
        if (!isDeepStrictEqual(long, lexical)) {
          console.log(`  ${locale}.longDescription: ${plainText(long).length} chars of text → ${plainText(lexical).length}, from ${slug}.${locale}.md`)
          long = lexical
          data.longDescription = long
        }
      }
      for (const [from, to] of p.replaceInLong?.[locale] ?? []) {
        // Already applied when the old sentence is gone.
        if (!JSON.stringify(long ?? {}).includes(JSON.stringify(from).slice(1, -1))) continue
        long = replaceSentence(long, from, to)
        data.longDescription = long
        console.log(`  ${locale}.longDescription: ${show(from)} → ${show(to)}`)
      }
      if (Object.keys(data).length) perLocale[locale] = data
    }
    const n = Object.keys(shared).length + Object.values(perLocale).reduce((a, d) => a + Object.keys(d!).length, 0)
    if (!n) console.log('  nothing to change')
    changes += n
    if (apply && n) {
      await payload.update({ collection: 'projects', id: en.id, locale: 'en', data: { ...shared, ...(perLocale.en ?? {}) } })
      if (perLocale.zh) await payload.update({ collection: 'projects', id: en.id, locale: 'zh', data: perLocale.zh })
      console.log('  written')
    }
    console.log('')
  }
  console.log(apply ? 'Done.' : changes ? `${changes} field changes. Nothing written. Re-run with --apply to write.` : 'Nothing to change.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
