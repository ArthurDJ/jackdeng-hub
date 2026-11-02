import { describe, expect, it } from 'vitest'
import { fitDescription, pageTitle } from './metaText'

describe('fitDescription', () => {
  it('leaves a short description alone, whitespace tidied', () => {
    expect(fitDescription('  Two  words. ', 'en')).toBe('Two words.')
  })

  it('cuts at the last sentence that fits', () => {
    // The live project description that ran to 197 characters.
    const text =
      'A read-only portal where B2B customers check their orders, the production status of each unit, their invoices and what they still owe. Its UI components became a shared kit for other internal apps.'
    expect(fitDescription(text, 'en')).toBe(
      'A read-only portal where B2B customers check their orders, the production status of each unit, their invoices and what they still owe.',
    )
  })

  it('falls back to a clause break, with an ellipsis, inside the limit', () => {
    const text =
      "The site you're reading: the frontend and Payload CMS 3 live in one Next.js 16 app, the data sits in Supabase Postgres, and it deploys to Vercel, in English and Chinese."
    const out = fitDescription(text, 'en')
    expect(out).toBe(
      "The site you're reading: the frontend and Payload CMS 3 live in one Next.js 16 app, the data sits in Supabase Postgres, and it deploys to Vercel…",
    )
    expect(out.length).toBeLessThanOrEqual(160)
  })

  it('does not cut at a full stop inside a version number', () => {
    const text = `Runs on Next.js 16 ${'and a long tail of words '.repeat(8)}`
    const out = fitDescription(text, 'en')
    expect(out.endsWith('…')).toBe(true)
    expect(out.startsWith('Runs on Next.js 16 and')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(160)
  })

  it('keeps a sentence that ends exactly at the limit', () => {
    const first = `${'a'.repeat(159)}.`
    expect(fitDescription(`${first} And more after it.`, 'en')).toBe(first)
  })

  it('does not treat an abbreviation as the end of a sentence', () => {
    // The "e.g." sits past the halfway mark, where a cut may land.
    const text = `${'word '.repeat(20)}tools, e.g. dbt and Databricks ${'more words '.repeat(10)}`
    const out = fitDescription(text, 'en')
    expect(out).toBe(`${'word '.repeat(20)}tools…`)
    expect(out.length).toBeLessThanOrEqual(160)
  })

  it('cuts Chinese at a 。 within 80 characters', () => {
    const first = '把报表 SQL 从 SQL Server 搬到 Databricks，迁移笔记说周数最多差 1。'
    const text = `${first}${'后面还有很长的一段解释，'.repeat(6)}`
    expect(fitDescription(text, 'zh')).toBe(first)
  })

  it('never returns more than the limit', () => {
    const text = 'x'.repeat(400)
    expect(fitDescription(text, 'en').length).toBeLessThanOrEqual(160)
    expect(fitDescription(text, 'zh').length).toBeLessThanOrEqual(80)
  })
})

describe('pageTitle', () => {
  it('keeps the template when the suffix fits', () => {
    expect(pageTitle('DataHub', 'en')).toBe('DataHub')
  })

  it('drops the suffix when it would push the title past 60', () => {
    const long = 'One app, one deploy: running a CMS inside Next.js'
    expect(pageTitle(long, 'en')).toEqual({ absolute: long })
  })

  it('uses the tighter limit for Chinese', () => {
    expect(pageTitle('迁移笔记里写着“最多差 1”，实际差了 2 天', 'zh')).toEqual({
      absolute: '迁移笔记里写着“最多差 1”，实际差了 2 天',
    })
    expect(pageTitle('项目归档', 'zh')).toBe('项目归档')
  })
})
