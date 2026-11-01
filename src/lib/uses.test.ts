import { describe, expect, it } from 'vitest'
import { BUILTIN_TOOLS } from '../components/tools/registry'
import en from '../i18n/messages/en.json'
import zh from '../i18n/messages/zh.json'
import { BUILT_HERE, USES } from './uses'

describe('USES', () => {
  const items = USES.flatMap((g) => g.items)

  it('has unique ids and https links', () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
    expect(new Set(USES.map((g) => g.id)).size).toBe(USES.length)
    for (const i of items) expect(i.href, i.id).toMatch(/^https:\/\//)
  })

  it('has words for every group and item in both languages', () => {
    for (const m of [en, zh]) {
      for (const g of USES) expect(m.uses.groups, g.id).toHaveProperty([g.id])
      for (const i of items) expect(m.uses.items, i.id).toHaveProperty([i.id])
      // And nothing left over from an item that was taken out.
      expect(Object.keys(m.uses.items).sort()).toEqual(items.map((i) => i.id).sort())
    }
  })

  it('lists only Playground tools that exist', () => {
    for (const slug of BUILT_HERE) expect(BUILTIN_TOOLS, slug).toHaveProperty([slug])
  })
})
