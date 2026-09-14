import { describe, expect, it } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  // A fixed instant. The timezone is pinned to UTC in vitest.config.ts —
  // formatDate formats in local time, so this instant is 15 September at
  // UTC+12 and the assertions below would fail there.
  const iso = '2026-09-14T12:00:00.000Z'

  it('formats English as month-day-year', () => {
    expect(formatDate(iso, 'en')).toBe('Sep 14, 2026')
  })

  it('formats Chinese with the zh-CN calendar', () => {
    expect(formatDate(iso, 'zh')).toBe('2026年9月14日')
  })

  it('defaults to English when no locale is given', () => {
    expect(formatDate(iso)).toBe(formatDate(iso, 'en'))
  })

  it('treats an unknown locale as English', () => {
    // The implementation only branches on 'zh', so anything else must not
    // silently produce a third format.
    expect(formatDate(iso, 'de')).toBe(formatDate(iso, 'en'))
  })
})
