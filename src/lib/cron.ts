/**
 * The Cron Explainer's rules: parse a five-field cron expression — the
 * crontab dialect that GitHub Actions, Vercel and Kubernetes CronJobs all
 * use — and list when it fires next. src/components/tools/CronExplainer.tsx
 * only draws the result.
 *
 * Supported: `*`, numbers, ranges `a-b`, steps `*\/n` and `a-b/n`, lists,
 * month and weekday names, 7 as Sunday, and the @hourly-style macros.
 * Quartz's seconds field, `?`, `L` and `W` (Databricks job schedules) are
 * not: they fail with a message that says so.
 */

export type FieldKey = 'minute' | 'hour' | 'dom' | 'month' | 'dow'

export const FIELDS: { key: FieldKey; min: number; max: number }[] = [
  { key: 'minute', min: 0, max: 59 },
  { key: 'hour', min: 0, max: 23 },
  { key: 'dom', min: 1, max: 31 },
  { key: 'month', min: 1, max: 12 },
  { key: 'dow', min: 0, max: 6 },
]

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export const MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
}

export interface Schedule {
  /** The values each field allows, sorted. */
  values: Record<FieldKey, number[]>
  /** Which fields were `*` (or a step over the whole range): shown as "every". */
  any: Record<FieldKey, boolean>
  /**
   * Which fields start with `*` — `*\/2` included. This, not `any`, decides
   * how the two day fields combine: Vixie cron (DOM_STAR/DOW_STAR) and
   * robfig/cron (Kubernetes) both flag a field by its leading `*`.
   */
  star: Record<FieldKey, boolean>
}

/** Why an expression was rejected; the component turns `code` into words. */
export class CronError extends Error {
  constructor(public code: 'fieldCount' | 'quartz' | 'badValue' | 'outOfRange' | 'badStep', public field?: FieldKey, public token?: string) {
    super(`${code}${field ? ` in ${field}` : ''}${token ? `: ${token}` : ''}`)
  }
}

function toNumber(token: string, field: FieldKey): number {
  const upper = token.toUpperCase()
  if (field === 'month' && MONTHS.includes(upper)) return MONTHS.indexOf(upper) + 1
  if (field === 'dow' && DAYS.includes(upper)) return DAYS.indexOf(upper)
  if (!/^\d+$/.test(token)) throw new CronError('badValue', field, token)
  return Number(token)
}

function parseField(text: string, spec: (typeof FIELDS)[number]): { values: number[]; any: boolean } {
  const { key, min } = spec
  // Weekdays accept 7 for Sunday on the way in.
  const max = key === 'dow' ? 7 : spec.max
  const out = new Set<number>()
  let any = false

  for (const part of text.split(',')) {
    const [range, stepText, extra] = part.split('/')
    if (extra !== undefined || range === '') throw new CronError('badValue', key, part)
    const step = stepText === undefined ? 1 : Number(stepText)
    if (!Number.isInteger(step) || step < 1) throw new CronError('badStep', key, part)

    let lo: number
    let hi: number
    if (range === '*') {
      lo = min
      hi = spec.max
      if (step === 1) any = true
    } else if (range.includes('-')) {
      const [a, b, more] = range.split('-')
      if (more !== undefined) throw new CronError('badValue', key, part)
      lo = toNumber(a, key)
      hi = toNumber(b, key)
    } else {
      lo = toNumber(range, key)
      // `5/15` means from 5 to the end, every 15.
      hi = stepText === undefined ? lo : spec.max
    }
    if (lo < min || hi > max || lo > hi) throw new CronError('outOfRange', key, part)
    for (let v = lo; v <= hi; v += step) out.add(key === 'dow' && v === 7 ? 0 : v)
  }
  return { values: [...out].sort((a, b) => a - b), any }
}

export function parseCron(expr: string): Schedule {
  const trimmed = expr.trim()
  const text = MACROS[trimmed.toLowerCase()] ?? trimmed
  const parts = text.split(/\s+/).filter(Boolean)
  if (parts.some((p) => /[?LW#]/i.test(p.replace(/[A-Z]{3}/gi, '')))) throw new CronError('quartz')
  if (parts.length === 6 || parts.length === 7) throw new CronError('quartz')
  if (parts.length !== 5) throw new CronError('fieldCount')

  const values = {} as Schedule['values']
  const any = {} as Schedule['any']
  const star = {} as Schedule['star']
  FIELDS.forEach((spec, i) => {
    const f = parseField(parts[i], spec)
    values[spec.key] = f.values
    any[spec.key] = f.any
    star[spec.key] = parts[i].startsWith('*')
  })
  return { values, any, star }
}

/**
 * Whether a day matches. When neither day field starts with `*`, cron fires
 * on either one ("the 1st, and every Monday") — the rule people trip over
 * most. Otherwise both must match, so `*\/2` with Monday is odd Mondays only.
 */
function dayMatches(s: Schedule, dom: number, dow: number): boolean {
  const okDom = s.values.dom.includes(dom)
  const okDow = s.values.dow.includes(dow)
  return s.star.dom || s.star.dow ? okDom && okDow : okDom || okDow
}

/** Calendar access in UTC or in the runtime's local zone. */
function clock(utc: boolean) {
  return utc
    ? {
        get: (d: Date) => [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCDay()] as const,
        make: (y: number, mo: number, d: number, h: number, mi: number) => new Date(Date.UTC(y, mo - 1, d, h, mi)),
      }
    : {
        get: (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getDay()] as const,
        make: (y: number, mo: number, d: number, h: number, mi: number) => new Date(y, mo - 1, d, h, mi),
      }
}

/**
 * The next `count` times the schedule fires strictly after `from`. Skips a
 * whole month, day or hour at a time when that field cannot match, so even
 * `0 0 29 2 *` (leap days only) is found in a few hundred steps. Gives up
 * after eight years, which only an impossible date like `0 0 31 2 *` hits.
 */
export function nextRuns(s: Schedule, from: Date, count: number, utc = true): Date[] {
  const { get, make } = clock(utc)
  const out: Date[] = []
  const [y0, mo0, d0, h0, mi0] = get(from)
  let t = make(y0, mo0, d0, h0, mi0 + 1)
  const limit = from.getTime() + 8 * 366 * 24 * 3600 * 1000

  while (out.length < count && t.getTime() <= limit) {
    const [y, mo, d, h, mi, dow] = get(t)
    if (!s.values.month.includes(mo)) { t = make(y, mo + 1, 1, 0, 0); continue }
    if (!dayMatches(s, d, dow)) { t = make(y, mo, d + 1, 0, 0); continue }
    if (!s.values.hour.includes(h)) { t = make(y, mo, d, h + 1, 0); continue }
    if (!s.values.minute.includes(mi)) { t = make(y, mo, d, h, mi + 1); continue }
    // In local time, the hour repeated when clocks go back reads as its first
    // occurrence, which can be before `from`; never list a run in the past.
    if (t.getTime() > from.getTime()) out.push(t)
    t = make(y, mo, d, h, mi + 1)
  }
  return out
}

/**
 * A field's values written compactly: `0–59` becomes "every", runs of three
 * or more become ranges. Used for the per-field breakdown.
 */
export function compact(values: number[], key: FieldKey): string {
  const names = key === 'month' ? MONTHS : key === 'dow' ? DAYS : null
  const label = (v: number) => (names ? names[key === 'month' ? v - 1 : v] : String(v))
  const runs: string[] = []
  for (let i = 0; i < values.length; ) {
    let j = i
    while (j + 1 < values.length && values[j + 1] === values[j] + 1) j++
    runs.push(j - i >= 2 ? `${label(values[i])}–${label(values[j])}` : values.slice(i, j + 1).map(label).join(','))
    i = j + 1
  }
  return runs.join(',')
}
