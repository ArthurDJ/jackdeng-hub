import { describe, expect, it } from 'vitest'
import { CronError, compact, nextRuns, parseCron } from './cron'

const iso = (ds: Date[]) => ds.map((d) => d.toISOString().slice(0, 16))

describe('parseCron', () => {
  it('expands stars, steps, ranges and lists', () => {
    const s = parseCron('*/15 9-17 1,15 * MON-FRI')
    expect(s.values.minute).toEqual([0, 15, 30, 45])
    expect(s.values.hour).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17])
    expect(s.values.dom).toEqual([1, 15])
    expect(s.values.dow).toEqual([1, 2, 3, 4, 5])
    expect(s.any).toEqual({ minute: false, hour: false, dom: false, month: true, dow: false })
  })

  it('reads names, 7 as Sunday, and a step from a start value', () => {
    expect(parseCron('0 0 * jan,Jul 7').values.month).toEqual([1, 7])
    expect(parseCron('0 0 * * 7').values.dow).toEqual([0])
    expect(parseCron('5/20 * * * *').values.minute).toEqual([5, 25, 45])
    expect(parseCron('0 0 * * 5-7').values.dow).toEqual([0, 5, 6])
  })

  it('expands macros', () => {
    expect(parseCron('@daily')).toEqual(parseCron('0 0 * * *'))
    expect(parseCron('@weekly').values.dow).toEqual([0])
  })

  it('says why it rejects an expression', () => {
    const code = (e: string) => { try { parseCron(e); return 'ok' } catch (err) { return (err as CronError).code } }
    expect(code('* * * *')).toBe('fieldCount')
    expect(code('0 0 12 * * ?')).toBe('quartz')
    expect(code('0 0 L * *')).toBe('quartz')
    expect(code('60 * * * *')).toBe('outOfRange')
    expect(code('0 0 0 * *')).toBe('outOfRange')
    expect(code('*/0 * * * *')).toBe('badStep')
    expect(code('abc * * * *')).toBe('badValue')
    expect(code('1-2-3 * * * *')).toBe('badValue')
  })
})

describe('nextRuns', () => {
  const from = new Date('2026-10-31T10:07:00Z') // a Saturday

  it('lists the next runs after the given time, not at it', () => {
    expect(iso(nextRuns(parseCron('*/15 * * * *'), from, 3))).toEqual(['2026-10-31T10:15', '2026-10-31T10:30', '2026-10-31T10:45'])
    expect(iso(nextRuns(parseCron('7 10 * * *'), from, 1))).toEqual(['2026-11-01T10:07'])
  })

  it('skips the weekend for weekdays', () => {
    expect(iso(nextRuns(parseCron('0 9 * * 1-5'), from, 2))).toEqual(['2026-11-02T09:00', '2026-11-03T09:00'])
  })

  it('fires on either day field when both are set', () => {
    // The 1st of the month, or any Monday.
    expect(iso(nextRuns(parseCron('0 0 1 * 1'), from, 3))).toEqual(['2026-11-01T00:00', '2026-11-02T00:00', '2026-11-09T00:00'])
  })

  it('finds leap days and gives up on impossible dates', () => {
    expect(iso(nextRuns(parseCron('0 0 29 2 *'), from, 1))).toEqual(['2028-02-29T00:00'])
    expect(nextRuns(parseCron('0 0 31 2 *'), from, 1)).toEqual([])
  })

  it('rolls over the year', () => {
    expect(iso(nextRuns(parseCron('@yearly'), from, 1))).toEqual(['2027-01-01T00:00'])
  })
})

describe('compact', () => {
  it('writes runs as ranges and names months and days', () => {
    expect(compact([0, 15, 30, 45], 'minute')).toBe('0,15,30,45')
    expect(compact([9, 10, 11, 12, 17], 'hour')).toBe('9–12,17')
    expect(compact([1, 2, 3, 4, 5], 'dow')).toBe('MON–FRI')
    expect(compact([1, 7], 'month')).toBe('JAN,JUL')
    expect(compact([1, 2], 'dom')).toBe('1,2')
  })
})
