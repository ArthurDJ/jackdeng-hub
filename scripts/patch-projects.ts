/**
 * Field-level edits to existing project records, in both locales, with a
 * read-only plan that prints every change as old → new.
 *
 *   npx tsx scripts/patch-projects.ts            # read-only: print the plan
 *   npx tsx scripts/patch-projects.ts --apply    # write it
 *
 * Each patch finds its record by `slug`. When the patch renames the slug and
 * the old one is gone but the new one exists, it counts as already applied,
 * so running twice is harmless. A long-description edit replaces one exact
 * sentence and fails if that sentence is not found exactly once.
 *
 * Script writes do not expire the page cache (that hook needs Next.js):
 * changes show within the hourly revalidation, or at once after saving any
 * project in /admin.
 */
import { loadEnv, requireApply, describeTarget } from './lib/env'
import { getPayload } from 'payload'

loadEnv()

const apply = process.argv.includes('--apply')
if (apply) requireApply({ script: 'scripts/patch-projects.ts', writes: ['projects'] })

type Locale = 'en' | 'zh'
type Localized = Partial<{ name: string; shortDescription: string; madeAt: string }>

interface Patch {
  slug: string
  set?: Partial<{ slug: string; year: string }>
  locales?: Partial<Record<Locale, Localized>>
  /** One exact sentence in the long description, and what replaces it. */
  replaceInLong?: Partial<Record<Locale, [string, string]>>
}

const PATCHES: Patch[] = [
  {
    slug: 'enterprise-manufacturing-analytics',
    set: { year: '2024–' },
    locales: { en: { madeAt: 'VWD' }, zh: { madeAt: 'VWD' } },
    replaceInLong: {
      en: ['Took part in the architecture design and deployment of the platform.', "Took part in the platform's architecture design and built part of it."],
      zh: ['参与平台的架构设计与部署。', '参与平台的架构设计，并搭建了其中一部分。'],
    },
  },
  {
    slug: 'jackdeng-hub',
    set: { year: '2026–' },
    locales: { en: { madeAt: 'Personal' }, zh: { madeAt: '个人项目' } },
  },
  // The two work systems carry no company name in their name, URL or text;
  // "made at" still says where.
  {
    slug: 'vwd-datahub',
    set: { slug: 'data-hub' },
    locales: { en: { name: 'DataHub', madeAt: 'VWD' }, zh: { name: 'DataHub 数据中台', madeAt: 'VWD' } },
  },
  {
    slug: 'viterra-customer-portal',
    set: { slug: 'b2b-customer-portal' },
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

async function run() {
  const configPromise = (await import('../src/payload.config')).default
  const payload = await getPayload({ config: configPromise })
  console.log(`database: ${describeTarget().host}${apply ? '' : ' (read-only run)'}\n`)

  const find = async (slug: string, locale: Locale) =>
    (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, locale })).docs[0]

  let changes = 0
  for (const p of PATCHES) {
    const en = await find(p.slug, 'en')
    if (!en) {
      if (p.set?.slug && (await find(p.set.slug, 'en'))) {
        console.log(`${p.slug}: already renamed to ${p.set.slug}, skipped\n`)
        continue
      }
      throw new Error(`${p.slug}: not found`)
    }
    console.log(`${p.slug} (id ${en.id})`)
    const shared: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(p.set ?? {})) {
      if ((en as any)[k] === v) continue
      console.log(`  ${k}: ${show((en as any)[k])} → ${show(v)}`)
      shared[k] = v
    }
    const perLocale: Partial<Record<Locale, Record<string, unknown>>> = {}
    for (const locale of ['en', 'zh'] as const) {
      const doc = locale === 'en' ? en : await find(p.slug, locale)
      const data: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(p.locales?.[locale] ?? {})) {
        if ((doc as any)[k] === v) continue
        console.log(`  ${locale}.${k}: ${show((doc as any)[k])} → ${show(v)}`)
        data[k] = v
      }
      const rep = p.replaceInLong?.[locale]
      if (rep && !JSON.stringify(doc.longDescription ?? {}).includes(JSON.stringify(rep[1]).slice(1, -1))) {
        data.longDescription = replaceSentence(doc.longDescription, rep[0], rep[1])
        console.log(`  ${locale}.longDescription: ${show(rep[0])} → ${show(rep[1])}`)
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
