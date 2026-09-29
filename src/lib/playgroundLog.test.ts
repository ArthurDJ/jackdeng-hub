import { describe, expect, it } from 'vitest'
import { BUILTIN_TOOLS } from '../components/tools/registry'
import en from '../i18n/messages/en.json'
import zh from '../i18n/messages/zh.json'
import { PLAYGROUND_LOG, prUrl, visibleLog } from './playgroundLog'

describe('PLAYGROUND_LOG', () => {
  it('has a launch entry for every builtin tool, and one only', () => {
    for (const slug of Object.keys(BUILTIN_TOOLS)) {
      const launches = PLAYGROUND_LOG.filter((e) => e.kind === 'launch' && e.slugs.includes(slug))
      expect(launches, slug).toHaveLength(1)
    }
  })

  it('names only builtin tools', () => {
    for (const e of PLAYGROUND_LOG) for (const s of e.slugs) expect(BUILTIN_TOOLS, `${e.id}: ${s}`).toHaveProperty([s])
  })

  it('runs newest first, later PRs first within a day', () => {
    const keys = PLAYGROUND_LOG.map((e) => `${e.date}#${String(e.pr).padStart(5, '0')}`)
    expect(keys).toEqual([...keys].sort().reverse())
  })

  it('uses real calendar days and unique ids', () => {
    for (const e of PLAYGROUND_LOG) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(new Date(`${e.date}T00:00:00Z`).toISOString().slice(0, 10)).toBe(e.date)
    }
    expect(new Set(PLAYGROUND_LOG.map((e) => e.id)).size).toBe(PLAYGROUND_LOG.length)
  })

  it('has words for every entry in both languages', () => {
    for (const e of PLAYGROUND_LOG) {
      expect(en.tools.log.entries, e.id).toHaveProperty([e.id])
      expect(zh.tools.log.entries, e.id).toHaveProperty([e.id])
    }
  })
})

describe('visibleLog', () => {
  const entries = [
    { id: 'a', date: '2026-09-28', kind: 'launch' as const, pr: 3, slugs: ['one', 'hidden'] },
    { id: 'b', date: '2026-09-27', kind: 'launch' as const, pr: 2, slugs: ['hidden'] },
    { id: 'c', date: '2026-09-26', kind: 'rename' as const, pr: 1, slugs: [] },
  ]

  it('keeps public tools, drops entries left with none, keeps section-wide ones', () => {
    const out = visibleLog(entries, [{ slug: 'one', name: 'One' }])
    expect(out.map((r) => r.entry.id)).toEqual(['a', 'c'])
    expect(out[0].tools).toEqual([{ slug: 'one', name: 'One' }])
    expect(out[1].tools).toEqual([])
  })
})

it('links a PR on GitHub', () => {
  expect(prUrl(94)).toBe('https://github.com/ArthurDJ/jackdeng-hub/pull/94')
})
