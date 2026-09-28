import { describe, expect, it } from 'vitest'
import {
  BREAKABLE_TEST,
  JAFFLE_SHOP,
  descendants,
  dotted,
  executionOrder,
  runDbt,
  skippedBy,
} from './dbtLog'
import { seeded } from './seeded'

const names = (xs: { name: string }[]) => xs.map((x) => x.name)
const start = new Date(2026, 8, 28, 14, 2, 11)

describe('JAFFLE_SHOP', () => {
  it('has the published counts: 3 seeds, 5 models, 20 tests', () => {
    expect(JAFFLE_SHOP.filter((n) => n.kind === 'seed')).toHaveLength(3)
    expect(JAFFLE_SHOP.filter((n) => n.kind === 'view' || n.kind === 'table')).toHaveLength(5)
    expect(JAFFLE_SHOP.filter((n) => n.kind === 'test')).toHaveLength(20)
  })

  it('only depends on nodes that exist', () => {
    const all = new Set(names(JAFFLE_SHOP))
    for (const n of JAFFLE_SHOP) for (const p of n.dependsOn) expect(all).toContain(p)
  })
})

describe('executionOrder', () => {
  it('puts every parent before its children', () => {
    const order = names(executionOrder(JAFFLE_SHOP, 'build'))
    for (const n of JAFFLE_SHOP) {
      for (const p of n.dependsOn) expect(order.indexOf(p)).toBeLessThan(order.indexOf(n.name))
    }
  })

  it("runs a model's tests before anything downstream of it", () => {
    const order = names(executionOrder(JAFFLE_SHOP, 'build'))
    expect(order.indexOf('accepted_values_stg_orders_status')).toBeLessThan(order.indexOf('orders'))
    expect(order.indexOf('unique_stg_customers_customer_id')).toBeLessThan(order.indexOf('customers'))
  })

  it('selects by command', () => {
    expect(executionOrder(JAFFLE_SHOP, 'seed').every((n) => n.kind === 'seed')).toBe(true)
    expect(names(executionOrder(JAFFLE_SHOP, 'run'))).toEqual(['stg_customers', 'stg_orders', 'stg_payments', 'customers', 'orders'])
    expect(executionOrder(JAFFLE_SHOP, 'test')).toHaveLength(20)
  })
})

describe('descendants', () => {
  it('follows refs transitively', () => {
    const d = descendants(JAFFLE_SHOP, 'raw_orders')
    expect(d).toContain('stg_orders')
    expect(d).toContain('orders')
    expect(d).toContain('customers')
    expect(d).toContain('relationships_orders_customer_id__customers')
    expect(d).not.toContain('raw_orders')
    expect(d).not.toContain('stg_payments')
  })
})

describe('skippedBy', () => {
  const skipped = skippedBy(JAFFLE_SHOP, BREAKABLE_TEST)

  it('skips the models downstream of the tested model and their tests', () => {
    expect(skipped).toContain('customers')
    expect(skipped).toContain('orders')
    expect(skipped).toContain('unique_orders_order_id')
    expect(skipped).toContain('relationships_orders_customer_id__customers')
  })

  it("keeps the tested model's other tests, and the failing test itself", () => {
    expect(skipped).not.toContain('unique_stg_orders_order_id')
    expect(skipped).not.toContain('not_null_stg_orders_order_id')
    expect(skipped).not.toContain(BREAKABLE_TEST)
    expect(skipped).not.toContain('stg_orders')
  })

  it('leaves branches that do not depend on the model alone', () => {
    expect(skipped).not.toContain('stg_payments')
    expect(skipped).not.toContain('unique_stg_payments_payment_id')
  })

  it('returns nothing for a name that is not a test', () => {
    expect(skippedBy(JAFFLE_SHOP, 'orders').size).toBe(0)
  })
})

describe('dotted', () => {
  it('pads to a fixed width', () => {
    const a = dotted('1 of 28 START test x', 'RUN')
    const b = dotted('10 of 28 START sql view model dev.stg_orders', 'RUN')
    expect(a.indexOf('[')).toBe(b.indexOf('['))
  })

  it('keeps at least three dots when the message is long', () => {
    expect(dotted('x'.repeat(100), 'OK')).toContain(' ... [OK]')
  })
})

describe('runDbt', () => {
  it('passes everything on a clean build', () => {
    const r = runDbt('build', { random: seeded(1), start })
    expect(r).toMatchObject({ pass: 28, error: 0, skip: 0 })
    expect(r.lines.at(-1)!.text).toMatch(/Done\. PASS=28 WARN=0 ERROR=0 SKIP=0 TOTAL=28$/)
    expect(r.lines.some((l) => l.text.endsWith('Completed successfully'))).toBe(true)
  })

  it('fails one test and skips what depends on its model', () => {
    const r = runDbt('build', { failing: BREAKABLE_TEST, random: seeded(1), start })
    const skip = skippedBy(JAFFLE_SHOP, BREAKABLE_TEST).size
    expect(r).toMatchObject({ error: 1, skip, pass: 28 - 1 - skip })
    expect(r.lines.some((l) => l.tone === 'error' && l.text.includes(`FAIL 3 ${BREAKABLE_TEST}`))).toBe(true)
    expect(r.lines.some((l) => l.tone === 'warn' && l.text.includes('SKIP relation dev.orders'))).toBe(true)
  })

  it('does not skip anything under dbt test', () => {
    const r = runDbt('test', { failing: BREAKABLE_TEST, random: seeded(1), start })
    expect(r).toMatchObject({ pass: 19, error: 1, skip: 0 })
  })

  it('ignores the failing test under dbt run, which runs no tests', () => {
    const r = runDbt('run', { failing: BREAKABLE_TEST, random: seeded(1), start })
    expect(r).toMatchObject({ pass: 5, error: 0, skip: 0 })
    expect(r.lines.some((l) => l.text.includes('Finished running 3 view models, 2 table models in'))).toBe(true)
  })

  it('prints the seed row counts', () => {
    const r = runDbt('seed', { random: seeded(1), start })
    expect(r.lines.some((l) => /OK loaded seed file dev\.raw_payments \.+ \[INSERT 113 in \d\.\d\ds\]/.test(l.text))).toBe(true)
  })

  it('stamps every line with a clock that only moves forward', () => {
    const r = runDbt('build', { random: seeded(2), start })
    const stamps = r.lines.map((l) => l.text.slice(0, 8))
    expect(stamps[0]).toBe('14:02:11')
    expect([...stamps].sort()).toEqual(stamps)
  })

  it('is repeatable with the same seed', () => {
    expect(runDbt('build', { random: seeded(7), start })).toEqual(runDbt('build', { random: seeded(7), start }))
  })
})
