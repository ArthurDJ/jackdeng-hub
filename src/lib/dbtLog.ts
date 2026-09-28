/**
 * A simulated dbt run over jaffle_shop, the demo project dbt Labs publishes
 * (github.com/dbt-labs/jaffle_shop): three seeds, three staging views, two
 * mart tables and the 20 tests in its schema files. Nothing here talks to a
 * warehouse; it produces the lines the dbt CLI would print, in the order it
 * would print them, for the Playground's CRT terminal.
 *
 * Kept pure so the parts that are easy to get subtly wrong are testable: the
 * build order (a model's tests run before anything downstream of it), and
 * what a failing test skips (everything downstream of the model it tests,
 * but not that model's other tests).
 */

export type NodeKind = 'seed' | 'view' | 'table' | 'test'

export interface DbtNode {
  name: string
  kind: NodeKind
  /** Parents: a model's refs, or the model(s) a test checks. */
  dependsOn: string[]
  /** Seeds only: rows in the CSV. */
  rows?: number
}

const test = (name: string, ...dependsOn: string[]): DbtNode => ({ name, kind: 'test', dependsOn })

/** jaffle_shop as published: seeds, models and schema tests. */
export const JAFFLE_SHOP: DbtNode[] = [
  { name: 'raw_customers', kind: 'seed', dependsOn: [], rows: 100 },
  { name: 'raw_orders', kind: 'seed', dependsOn: [], rows: 99 },
  { name: 'raw_payments', kind: 'seed', dependsOn: [], rows: 113 },

  { name: 'stg_customers', kind: 'view', dependsOn: ['raw_customers'] },
  test('unique_stg_customers_customer_id', 'stg_customers'),
  test('not_null_stg_customers_customer_id', 'stg_customers'),

  { name: 'stg_orders', kind: 'view', dependsOn: ['raw_orders'] },
  test('unique_stg_orders_order_id', 'stg_orders'),
  test('not_null_stg_orders_order_id', 'stg_orders'),
  test('accepted_values_stg_orders_status', 'stg_orders'),

  { name: 'stg_payments', kind: 'view', dependsOn: ['raw_payments'] },
  test('unique_stg_payments_payment_id', 'stg_payments'),
  test('not_null_stg_payments_payment_id', 'stg_payments'),
  test('accepted_values_stg_payments_payment_method', 'stg_payments'),

  { name: 'customers', kind: 'table', dependsOn: ['stg_customers', 'stg_orders', 'stg_payments'] },
  test('unique_customers_customer_id', 'customers'),
  test('not_null_customers_customer_id', 'customers'),

  { name: 'orders', kind: 'table', dependsOn: ['stg_orders', 'stg_payments'] },
  test('unique_orders_order_id', 'orders'),
  test('not_null_orders_order_id', 'orders'),
  test('not_null_orders_customer_id', 'orders'),
  test('accepted_values_orders_status', 'orders'),
  test('not_null_orders_amount', 'orders'),
  test('not_null_orders_credit_card_amount', 'orders'),
  test('not_null_orders_coupon_amount', 'orders'),
  test('not_null_orders_bank_transfer_amount', 'orders'),
  test('not_null_orders_gift_card_amount', 'orders'),
  test('relationships_orders_customer_id__customers', 'orders', 'customers'),
]

/** The test the terminal's "break a test" switch makes fail. */
export const BREAKABLE_TEST = 'accepted_values_stg_orders_status'

export type DbtCommand = 'build' | 'run' | 'test' | 'seed'
export type Tone = 'plain' | 'dim' | 'ok' | 'warn' | 'error'

export interface LogLine {
  text: string
  tone: Tone
  /** Wait before printing this line, in ms of simulated time. */
  delay: number
}

export interface RunOptions {
  failing?: string | null
  /** 0 ≤ n < 1. Pass a seeded one for repeatable output. */
  random?: () => number
  start?: Date
  schema?: string
}

export interface RunResult {
  lines: LogLine[]
  pass: number
  error: number
  skip: number
}

const SELECTS: Record<DbtCommand, (n: DbtNode) => boolean> = {
  build: () => true,
  run: (n) => n.kind === 'view' || n.kind === 'table',
  test: (n) => n.kind === 'test',
  seed: (n) => n.kind === 'seed',
}

/** The nodes of `command`, parents before children, a model's tests right after it. */
export function executionOrder(nodes: DbtNode[], command: DbtCommand): DbtNode[] {
  const byName = new Map(nodes.map((n) => [n.name, n]))
  const done = new Set<string>()
  const order: DbtNode[] = []
  const visit = (n: DbtNode) => {
    if (done.has(n.name)) return
    for (const p of n.dependsOn) {
      const parent = byName.get(p)
      if (parent) visit(parent)
    }
    done.add(n.name)
    order.push(n)
  }
  // Declaration order breaks ties, and JAFFLE_SHOP lists each model's tests
  // right after it, which is where `dbt build` runs them.
  nodes.forEach(visit)
  return order.filter(SELECTS[command])
}

/** Every node downstream of `name`, not counting `name` itself. */
export function descendants(nodes: DbtNode[], name: string): Set<string> {
  const out = new Set<string>()
  let frontier = [name]
  while (frontier.length) {
    const next: string[] = []
    for (const n of nodes) {
      if (out.has(n.name)) continue
      if (n.dependsOn.some((p) => frontier.includes(p))) {
        out.add(n.name)
        next.push(n.name)
      }
    }
    frontier = next
  }
  return out
}

/**
 * What `dbt build` skips when `failingTest` fails: everything downstream of
 * the model it tests, except tests whose parents all still ran. The other
 * tests on that same model run as usual.
 */
export function skippedBy(nodes: DbtNode[], failingTest: string): Set<string> {
  const failing = nodes.find((n) => n.name === failingTest)
  if (!failing || failing.kind !== 'test') return new Set()
  const down = new Set<string>()
  for (const parent of failing.dependsOn) descendants(nodes, parent).forEach((n) => down.add(n))
  const out = new Set<string>()
  for (const n of nodes) {
    if (!down.has(n.name)) continue
    if (n.kind === 'test' && !n.dependsOn.some((p) => down.has(p))) continue
    out.add(n.name)
  }
  return out
}

const WIDTH = 64

/** dbt's dotted leader: `message ....... [STATUS]`. */
export function dotted(message: string, status: string, width = WIDTH): string {
  const dots = Math.max(3, width - message.length - 1)
  return `${message} ${'.'.repeat(dots)} [${status}]`
}

const pad2 = (n: number) => String(n).padStart(2, '0')
export const clock = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`

const secs = (ms: number) => (ms / 1000).toFixed(2)

function describe(n: DbtNode, schema: string) {
  switch (n.kind) {
    case 'seed': return { start: `seed file ${schema}.${n.name}`, done: `loaded seed file ${schema}.${n.name}` }
    case 'view': return { start: `sql view model ${schema}.${n.name}`, done: `created sql view model ${schema}.${n.name}` }
    case 'table': return { start: `sql table model ${schema}.${n.name}`, done: `created sql table model ${schema}.${n.name}` }
    case 'test': return { start: `test ${n.name}`, done: n.name }
  }
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`
}

export function runDbt(command: DbtCommand, opts: RunOptions = {}): RunResult {
  const random = opts.random ?? Math.random
  const schema = opts.schema ?? 'dev'
  const failing = opts.failing ?? null
  const nodes = executionOrder(JAFFLE_SHOP, command)
  // Only `dbt build` skips: `dbt test` has nothing downstream to protect, and
  // `dbt run` does not run tests at all.
  const skipped = command === 'build' && failing && nodes.some((n) => n.name === failing)
    ? skippedBy(JAFFLE_SHOP, failing)
    : new Set<string>()

  let t = (opts.start ?? new Date()).getTime()
  const lines: LogLine[] = []
  const say = (text: string, tone: Tone, delay: number) => {
    t += delay
    lines.push({ text: `${clock(new Date(t))}  ${text}`.trimEnd(), tone, delay })
  }
  const blank = () => say('', 'plain', 0)

  const models = JAFFLE_SHOP.filter((n) => n.kind === 'view' || n.kind === 'table').length
  const seeds = JAFFLE_SHOP.filter((n) => n.kind === 'seed').length
  const tests = JAFFLE_SHOP.filter((n) => n.kind === 'test').length

  say(`Running with dbt=1.9.4`, 'dim', 120)
  say(`Registered adapter: databricks=1.9.1`, 'dim', 380)
  say(`Found ${models} models, ${seeds} seeds, ${tests} data tests, 537 macros`, 'dim', 420)
  blank()
  say(`Concurrency: 1 threads (target='dev')`, 'dim', 260)
  blank()

  const total = nodes.length
  let pass = 0
  let error = 0
  let skip = 0
  const startedAt = t

  nodes.forEach((n, i) => {
    const k = `${i + 1} of ${total}`
    if (skipped.has(n.name)) {
      skip++
      const what = n.kind === 'test' ? `test ${n.name}` : `relation ${schema}.${n.name}`
      say(dotted(`${k} SKIP ${what}`, 'SKIP'), 'warn', 40)
      return
    }
    const d = describe(n, schema)
    say(dotted(`${k} START ${d.start}`, 'RUN'), 'plain', 60)
    const ms = Math.round((n.kind === 'test' ? 40 : n.kind === 'seed' ? 180 : 90) + random() * (n.kind === 'test' ? 60 : 220))
    if (n.kind === 'test' && n.name === failing) {
      error++
      say(dotted(`${k} FAIL 3 ${d.done}`, `FAIL 3 in ${secs(ms)}s`), 'error', ms)
      return
    }
    pass++
    if (n.kind === 'test') say(dotted(`${k} PASS ${d.done}`, `PASS in ${secs(ms)}s`), 'ok', ms)
    else if (n.kind === 'seed') say(dotted(`${k} OK ${d.done}`, `INSERT ${n.rows} in ${secs(ms)}s`), 'ok', ms)
    else say(dotted(`${k} OK ${d.done}`, `OK in ${secs(ms)}s`), 'ok', ms)
  })

  const ran = (kind: NodeKind) => nodes.filter((n) => n.kind === kind).length
  const parts = [
    ran('seed') && plural(ran('seed'), 'seed'),
    ran('view') && plural(ran('view'), 'view model'),
    ran('table') && plural(ran('table'), 'table model'),
    ran('test') && plural(ran('test'), 'data test'),
  ].filter(Boolean)
  const elapsed = secs(t - startedAt + 310)

  blank()
  say(`Finished running ${parts.join(', ')} in 0 hours 0 minutes and ${elapsed} seconds (${elapsed}s).`, 'plain', 310)
  blank()
  if (error) {
    say(`Completed with ${plural(error, 'error')}, 0 partial successes, and 0 warnings:`, 'error', 20)
    blank()
    say(`Failure in test ${failing} (models/staging/schema.yml)`, 'error', 0)
    say(`  Got 3 results, configured to fail if != 0`, 'error', 0)
    blank()
    say(`  compiled code at target/compiled/jaffle_shop/models/staging/schema.yml/${failing}.sql`, 'dim', 0)
  } else {
    say('Completed successfully', 'ok', 20)
  }
  blank()
  say(`Done. PASS=${pass} WARN=0 ERROR=${error} SKIP=${skip} TOTAL=${total}`, error ? 'error' : 'ok', 0)

  return { lines, pass, error, skip }
}
