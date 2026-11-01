/**
 * The Epoch Converter's rules: read what someone pasted — a Unix timestamp
 * in any of the usual units, or a date string — and say which instant it is.
 * src/components/tools/EpochConverter.tsx only draws the answer.
 */

export type EpochUnit = 's' | 'ms' | 'us' | 'ns'

export type Parsed =
  /**
   * `ns` is the exact value for whole-number input. A Date only holds
   * milliseconds, so without it a pasted nanosecond timestamp would come
   * back with its last six digits zeroed.
   */
  | { kind: 'epoch'; unit: EpochUnit; date: Date; ns?: bigint }
  | { kind: 'date'; date: Date }

const PER_MS: Record<EpochUnit, number> = { s: 1e-3, ms: 1, us: 1e3, ns: 1e6 }
const NS_PER: Record<EpochUnit, bigint> = { s: 1000000000n, ms: 1000000n, us: 1000n, ns: 1n }

/**
 * The unit a bare number is most likely in, judged by its digit count:
 * seconds have 10 digits from 2001 to 2286, milliseconds 13, and so on.
 * Short numbers are seconds too (1970 plus a bit), which is what every
 * tool that prints epochs means by them.
 */
export function guessUnit(digits: string): EpochUnit {
  const n = digits.replace(/^-/, '').length
  if (n <= 11) return 's'
  if (n <= 14) return 'ms'
  if (n <= 17) return 'us'
  return 'ns'
}

/**
 * Read a timestamp or a date. Returns null for anything that does not name a
 * real instant. Date strings go through Date.parse, so a bare `2026-10-31`
 * is UTC midnight and `2026-10-31T09:00` is local time — the same rules as
 * every JavaScript runtime, which is where these strings usually come from.
 */
export function parseInput(raw: string, unit?: EpochUnit): Parsed | null {
  const text = raw.trim().replace(/[_,\s]/g, '')
  if (!text) return null

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const u = unit ?? guessUnit(text.split('.')[0])
    const ms = Number(text) / PER_MS[u]
    const date = new Date(ms)
    if (Number.isNaN(date.getTime())) return null
    return /^-?\d+$/.test(text)
      ? { kind: 'epoch', unit: u, date, ns: BigInt(text) * NS_PER[u] }
      : { kind: 'epoch', unit: u, date }
  }

  const ms = Date.parse(raw.trim())
  return Number.isNaN(ms) ? null : { kind: 'date', date: new Date(ms) }
}

/** Integer division rounding toward minus infinity, so -1500 ms is -2 s. */
const floorDiv = (a: bigint, b: bigint) => a / b - (a < 0n && a % b !== 0n ? 1n : 0n)

/** An exact nanosecond count in each unit, coarser units floored. */
export function fromNs(ns: bigint): Record<EpochUnit, string> {
  return {
    s: floorDiv(ns, NS_PER.s).toString(),
    ms: floorDiv(ns, NS_PER.ms).toString(),
    us: floorDiv(ns, NS_PER.us).toString(),
    ns: ns.toString(),
  }
}

/** The instant in each unit, as exact integer strings (BigInt, so ns don't round). */
export function toEpochs(date: Date): Record<EpochUnit, string> {
  return fromNs(BigInt(date.getTime()) * NS_PER.ms)
}

/**
 * The wall-clock time in a zone, as `YYYY-MM-DD HH:mm:ss` plus its UTC offset.
 * Built from formatToParts so the layout is the same in every locale.
 */
export function inZone(date: Date, timeZone: string): { text: string; offset: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'longOffset',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  const offset = get('timeZoneName').replace('GMT', '') || '+00:00'
  return {
    text: `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`,
    offset,
  }
}

const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]

/** "3 hours ago" / "3 小时后", in the largest unit that fits. */
export function relative(date: Date, now: Date, locale: string): string {
  const diff = Math.round((date.getTime() - now.getTime()) / 1000)
  const fmt = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, size] of STEPS) {
    if (Math.abs(diff) >= size || unit === 'second') {
      // Rounded, not truncated: 45 hours is "in 2 days", which keeps a list
      // of daily runs reading 21 hours, 2 days, 3 days rather than
      // 21 hours, tomorrow, 2 days.
      return fmt.format(Math.round(diff / size), unit)
    }
  }
  return fmt.format(0, 'second')
}
