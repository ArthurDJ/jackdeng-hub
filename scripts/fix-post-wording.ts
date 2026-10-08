/**
 * Correct what "Three ideas from systems engineering" says about the degree.
 *
 * The post called it a systems engineering master's. It is a master's in
 * engineering management (Trine University, from 07/2026); its first course,
 * SYS 5113 Systems Validation & Testing, is the systems engineering one the
 * post is about. It also said "the first eight weeks" and "one course in",
 * but classes began 08/24 and the post went up 09/22: about four weeks, with
 * the first course not yet finished.
 *
 * Each replacement must match exactly once in its field, or nothing is written.
 *
 *   npx tsx scripts/fix-post-wording.ts           # read-only: print what would change
 *   npx tsx scripts/fix-post-wording.ts --apply   # write it
 *
 * Writing from here skips the cache revalidation hooks (no Next.js request),
 * so it asks the live site to expire its caches afterwards
 * (scripts/lib/refreshSite.ts, which needs REVALIDATE_SECRET).
 */
import { loadEnv, requireApply, describeTarget } from './lib/env'
import { refreshLiveSite } from './lib/refreshSite'
import { getPayload } from 'payload'

loadEnv()
const apply = process.argv.includes('--apply')
if (apply) requireApply({ script: 'scripts/fix-post-wording.ts', writes: ['blogs'] })

const SLUG = 'three-ideas-from-systems-engineering'

type Fix = { field: 'excerpt' | 'content'; from: string; to: string }

const FIXES: Record<'en' | 'zh', Fix[]> = {
  en: [
    {
      field: 'excerpt',
      from: 'I expected vocabulary from a systems engineering degree.',
      to: 'I expected vocabulary from a systems engineering course.',
    },
    {
      field: 'content',
      from: "I started a systems engineering master's this year, and I went in expecting vocabulary. In the first eight weeks,",
      to: "This year I started a master's in engineering management. Its first course, Systems Validation & Testing, is a systems engineering course, and I went in expecting vocabulary. In the first few weeks,",
    },
    {
      field: 'content',
      from: 'At one course in, treat that as',
      to: "I'm not through my first course yet, so treat that as",
    },
  ],
  zh: [
    {
      field: 'excerpt',
      from: '念系统工程硕士之前，',
      to: '上系统工程课之前，',
    },
    {
      field: 'content',
      from: '今年我开始念系统工程硕士，进去之前我以为拿到的会是一套词汇。在最初的八周里，',
      to: '今年我开始念工程管理硕士，第一门课是系统工程方向的 Systems Validation & Testing（系统验证与测试）。上课之前我以为拿到的会是一套词汇。在最初的几周里，',
    },
    {
      field: 'content',
      from: '我才上完一门课，所以',
      to: '我第一门课还没上完，所以',
    },
  ],
}

/** Replace `from` in exactly one Lexical text node; throws on zero or several. */
function fixLexical(root: unknown, { from, to }: Fix): unknown {
  let hits = 0
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk)
    if (!node || typeof node !== 'object') return node
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(node)) {
      if (k === 'text' && typeof v === 'string' && v.includes(from)) {
        hits += v.split(from).length - 1
        out[k] = v.replace(from, to)
      } else {
        out[k] = walk(v)
      }
    }
    return out
  }
  const fixed = walk(root)
  if (hits !== 1) throw new Error(`"${from}" matched ${hits} times in the body; expected 1`)
  return fixed
}

async function run() {
  console.log(`${apply ? 'APPLY' : 'DRY RUN (read-only)'} against ${describeTarget().host}\n`)
  const config = (await import('../src/payload.config')).default
  const payload = await getPayload({ config })

  for (const locale of ['en', 'zh'] as const) {
    const { docs } = await payload.find({
      collection: 'blogs', where: { slug: { equals: SLUG } }, limit: 1, depth: 0, locale,
    })
    const doc = docs[0]
    if (!doc) throw new Error(`post ${SLUG} not found`)

    let excerpt = doc.excerpt ?? ''
    let content: unknown = doc.content
    for (const fix of FIXES[locale]) {
      if (fix.field === 'excerpt') {
        const n = excerpt.split(fix.from).length - 1
        if (n !== 1) throw new Error(`"${fix.from}" matched ${n} times in the ${locale} excerpt; expected 1`)
        excerpt = excerpt.replace(fix.from, fix.to)
      } else {
        content = fixLexical(content, fix)
      }
      console.log(`${locale} ${fix.field}\n  - ${fix.from}\n  + ${fix.to}`)
    }
    if (!apply) continue
    await payload.update({
      collection: 'blogs',
      id: doc.id,
      locale,
      data: { excerpt, content: content as typeof doc.content },
    })
    console.log(`  ${locale} written\n`)
  }
  console.log(apply ? '\nDone.' : '\nNothing written. Re-run with --apply to write.')
  if (apply) await refreshLiveSite({ isProduction: describeTarget().isProduction })
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
