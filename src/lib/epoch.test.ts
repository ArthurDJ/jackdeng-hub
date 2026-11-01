import { describe, expect, it } from 'vitest'
import { fromNs, guessUnit, inZone, parseInput, relative, toEpochs } from './epoch'

describe('guessUnit', () => {
  it('reads the unit off the digit count', () => {
    expect(guessUnit('1761900000')).toBe('s')
    expect(guessUnit('1761900000123')).toBe('ms')
    expect(guessUnit('1761900000123456')).toBe('us')
    expect(guessUnit('1761900000123456789')).toBe('ns')
    expect(guessUnit('86400')).toBe('s')
    expect(guessUnit('-86400')).toBe('s')
  })
})

describe('parseInput', () => {
  it('reads a timestamp in every unit as the same instant', () => {
    const iso = '2025-10-31T09:20:00.000Z'
    for (const v of ['1761902400', '1761902400000', '1761902400000000', '1761902400000000000']) {
      const p = parseInput(v)
      expect(p?.kind).toBe('epoch')
      expect(p?.date.toISOString()).toBe(iso)
    }
  })

  it('takes a forced unit over the guess', () => {
    expect(parseInput('1761902400', 'ms')?.date.toISOString()).toBe('1970-01-21T09:25:02.400Z')
  })

  it('ignores the separators people paste', () => {
    expect(parseInput(' 1_761_902_400 ')?.date.toISOString()).toBe('2025-10-31T09:20:00.000Z')
    expect(parseInput('1,761,902,400')?.date.toISOString()).toBe('2025-10-31T09:20:00.000Z')
  })

  it('keeps the exact value of whole-number input', () => {
    expect(parseInput('1761902400123456789')).toMatchObject({ unit: 'ns', ns: 1761902400123456789n })
    expect(parseInput('1761902400', 'us')).toMatchObject({ ns: 1761902400000n })
    expect(parseInput('1761902400.5')).not.toHaveProperty('ns')
  })

  it('reads date strings', () => {
    const p = parseInput('2025-10-31T09:20:00Z')
    expect(p).toEqual({ kind: 'date', date: new Date('2025-10-31T09:20:00Z') })
  })

  it('rejects what is not an instant', () => {
    expect(parseInput('')).toBeNull()
    expect(parseInput('next tuesday')).toBeNull()
    expect(parseInput('99999999999999999999999')).toBeNull()
  })
})

describe('toEpochs', () => {
  it('gives every unit exactly', () => {
    expect(toEpochs(new Date(1761902400123))).toEqual({
      s: '1761902400',
      ms: '1761902400123',
      us: '1761902400123000',
      ns: '1761902400123000000',
    })
  })

  it('gives back a pasted nanosecond value digit for digit', () => {
    expect(fromNs(1761902400123456789n)).toEqual({
      s: '1761902400',
      ms: '1761902400123',
      us: '1761902400123456',
      ns: '1761902400123456789',
    })
    expect(fromNs(-1500n)).toEqual({ s: '-1', ms: '-1', us: '-2', ns: '-1500' })
  })

  it('floors seconds before 1970', () => {
    expect(toEpochs(new Date(-1500)).s).toBe('-2')
    expect(toEpochs(new Date(-1000)).s).toBe('-1')
  })
})

describe('inZone', () => {
  const d = new Date('2025-10-31T09:20:05Z')
  it('prints the wall clock and the offset', () => {
    expect(inZone(d, 'UTC')).toEqual({ text: '2025-10-31 09:20:05', offset: '+00:00' })
    expect(inZone(d, 'Asia/Shanghai')).toEqual({ text: '2025-10-31 17:20:05', offset: '+08:00' })
    expect(inZone(d, 'America/Los_Angeles')).toEqual({ text: '2025-10-31 02:20:05', offset: '-07:00' })
  })
})

describe('relative', () => {
  const now = new Date('2025-10-31T12:00:00Z')
  it('picks the largest unit that fits', () => {
    expect(relative(new Date('2025-10-31T09:00:00Z'), now, 'en')).toBe('3 hours ago')
    expect(relative(new Date('2025-11-02T12:00:00Z'), now, 'en')).toBe('in 2 days')
    expect(relative(now, now, 'en')).toBe('now')
    expect(relative(new Date('2025-11-02T09:00:00Z'), now, 'en')).toBe('in 2 days') // 45 hours
  })

  it('says "in 2 days" after "in 21 hours" for daily runs', () => {
    const at = (h: number) => relative(new Date(now.getTime() + h * 3600e3), now, 'en')
    expect([at(21), at(45), at(69)]).toEqual(['in 21 hours', 'in 2 days', 'in 3 days'])
  })
})
