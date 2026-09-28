import { describe, expect, it } from 'vitest'
import { linkLabel, sortArchive, yearKey } from './projectArchive'

describe('yearKey', () => {
  it('uses the latest year mentioned', () => {
    expect(yearKey('2024')).toBe(2024)
    expect(yearKey('2022–2023')).toBe(2023)
    expect(yearKey('2021 - 2019')).toBe(2021)
  })
  it('treats an open range as ongoing', () => {
    expect(yearKey('2024–')).toBe(Infinity)
    expect(yearKey('2024–present')).toBe(Infinity)
    expect(yearKey('2024 至今')).toBe(Infinity)
  })
  it('has no key without a year', () => {
    expect(yearKey(null)).toBeNull()
    expect(yearKey('  ')).toBeNull()
    expect(yearKey('someday')).toBeNull()
  })
})

describe('sortArchive', () => {
  const row = (name: string, year: string | null, createdAt: string) => ({ name, year, createdAt })

  it('puts ongoing first, then newest year, then rows with no year', () => {
    const rows = [
      row('none-old', null, '2026-01-01'),
      row('2022', '2022', '2026-02-01'),
      row('ongoing', '2024–', '2026-01-01'),
      row('2023', '2021–2023', '2026-01-01'),
      row('none-new', null, '2026-05-01'),
    ]
    expect(sortArchive(rows).map((r) => r.name)).toEqual(['ongoing', '2023', '2022', 'none-new', 'none-old'])
  })

  it('keeps the newest record first within a year', () => {
    const rows = [row('a', '2024', '2026-01-01'), row('b', '2024', '2026-03-01')]
    expect(sortArchive(rows).map((r) => r.name)).toEqual(['b', 'a'])
  })

  it('does not change its input', () => {
    const rows = [row('a', null, '2026-01-01'), row('b', '2024', '2026-01-01')]
    sortArchive(rows)
    expect(rows.map((r) => r.name)).toEqual(['a', 'b'])
  })
})

describe('linkLabel', () => {
  it('drops the protocol, www and trailing slash', () => {
    expect(linkLabel('https://www.github.com/ArthurDJ/jackdeng-hub/')).toBe('github.com/ArthurDJ/jackdeng-hub')
    expect(linkLabel('https://jackdeng.cc')).toBe('jackdeng.cc')
  })
})
