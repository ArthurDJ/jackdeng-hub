import { describe, expect, it } from 'vitest'
import { bundledLanguages, bundledLanguagesAlias } from 'shiki'
import { CodeBlock } from '@payloadcms/richtext-lexical'
import { PLAIN, shikiLanguage } from './shikiLanguage'

/** The ids the editor's Code block can store, read from the block itself. */
const editorLanguages: string[] = (
  (CodeBlock().fields as any[]).find((f) => f.name === 'language')?.options ?? []
).map((o: { value: string }) => o.value)

describe('shikiLanguage', () => {
  it('reads a real list from the editor', () => {
    // Guards the test itself: an empty list would make the next one vacuous.
    expect(editorLanguages.length).toBeGreaterThan(50)
  })

  it('maps every language the editor offers to something Shiki can render', () => {
    // Drift guard. A Payload or Shiki upgrade that renames an id fails here,
    // not on a published post.
    for (const id of editorLanguages) {
      const lang = shikiLanguage(id)
      const renderable = lang === PLAIN || lang in bundledLanguages || lang in bundledLanguagesAlias
      expect(renderable, `${id} -> ${lang}`).toBe(true)
    }
  })

  it('keeps the languages a technical post actually uses coloured', () => {
    for (const id of ['typescript', 'javascript', 'python', 'sql', 'pgsql', 'shell', 'yaml', 'csharp', 'dockerfile']) {
      expect(shikiLanguage(id), id).not.toBe(PLAIN)
    }
  })

  it('folds the SQL dialects into the one SQL grammar', () => {
    expect(shikiLanguage('pgsql')).toBe('sql')
    expect(shikiLanguage('mysql')).toBe('sql')
    expect(shikiLanguage('redshift')).toBe('sql')
  })

  it('renames the ids Shiki spells differently', () => {
    expect(shikiLanguage('restructuredtext')).toBe('rst')
    expect(shikiLanguage('systemverilog')).toBe('system-verilog')
  })

  it('falls back to plain text, never throws, for anything unknown', () => {
    expect(shikiLanguage('plaintext')).toBe(PLAIN)
    expect(shikiLanguage('cameligo')).toBe(PLAIN)
    expect(shikiLanguage('not-a-language')).toBe(PLAIN)
    expect(shikiLanguage('')).toBe(PLAIN)
    expect(shikiLanguage(undefined)).toBe(PLAIN)
    expect(shikiLanguage(null)).toBe(PLAIN)
  })

  it('ignores case and surrounding space', () => {
    expect(shikiLanguage(' TypeScript ')).toBe('typescript')
  })
})
