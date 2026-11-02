import { describe, expect, it } from 'vitest'
import { describeMetaChange, metaChanges, metaData } from './postMeta'

const wanted = {
  en: { title: 'New title', excerpt: 'New excerpt' },
  zh: { title: '新标题', excerpt: '新摘要' },
}

describe('metaChanges', () => {
  it('is empty when both locales already match', () => {
    expect(metaChanges(wanted, wanted)).toEqual([])
  })

  it('lists only the fields that differ, en before zh, title before excerpt', () => {
    const stored = {
      en: { title: 'Old title', excerpt: 'New excerpt' },
      zh: { title: '新标题', excerpt: '旧摘要' },
    }
    expect(metaChanges(stored, wanted)).toEqual([
      { locale: 'en', field: 'title', from: 'Old title', to: 'New title' },
      { locale: 'zh', field: 'excerpt', from: '旧摘要', to: '新摘要' },
    ])
  })

  it('treats a missing locale, null and an empty string as empty', () => {
    const changes = metaChanges({ en: { title: 'New title', excerpt: '' }, zh: null }, wanted)
    expect(changes).toEqual([
      { locale: 'en', field: 'excerpt', from: null, to: 'New excerpt' },
      { locale: 'zh', field: 'title', from: null, to: '新标题' },
      { locale: 'zh', field: 'excerpt', from: null, to: '新摘要' },
    ])
  })

  it('counts a punctuation-only change as a change', () => {
    const stored = { ...wanted, en: { ...wanted.en, title: 'New title.' } }
    expect(metaChanges(stored, wanted)).toHaveLength(1)
  })
})

describe('metaData', () => {
  it('returns the changed fields of one locale as update data', () => {
    const changes = metaChanges({ en: { title: 'Old', excerpt: 'Old' }, zh: wanted.zh }, wanted)
    expect(metaData(changes, 'en')).toEqual({ title: 'New title', excerpt: 'New excerpt' })
    expect(metaData(changes, 'zh')).toEqual({})
  })
})

describe('describeMetaChange', () => {
  it('quotes both values and marks an empty one', () => {
    expect(describeMetaChange({ locale: 'zh', field: 'title', from: '旧', to: '新' })).toBe('zh title: "旧" → "新"')
    expect(describeMetaChange({ locale: 'en', field: 'excerpt', from: null, to: 'x' })).toBe('en excerpt: (empty) → "x"')
  })
})
