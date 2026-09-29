import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

// The Geist fonts are subset to src/fonts/subset.txt (scripts/subset-fonts.sh).
// A character outside it still shows, in a fallback font, so nothing would
// look broken enough to notice. This fails first.

function ranges(): [number, number][] {
  return readFileSync(join(__dirname, '../fonts/subset.txt'), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [a, b] = l.replace(/^U\+/, '').split('-')
      return [parseInt(a, 16), parseInt(b ?? a, 16)] as [number, number]
    })
}

/** Scripts Geist has no glyphs for, which fall back whatever the subset. */
function notGeist(cp: number) {
  return (
    (cp >= 0x2e80 && cp <= 0x9fff) || // CJK, and its punctuation
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xff00 && cp <= 0xffef) || // full-width forms
    (cp >= 0x2600 && cp <= 0x27bf) || // symbols and dingbats
    (cp >= 0x1f000) || // emoji
    cp === 0xfe0f // emoji presentation selector
  )
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|json)$/.test(f) && !f.endsWith('.test.ts') ? [p] : []
  })
}

describe('font subset', () => {
  it('parses to ordered, well-formed ranges', () => {
    const rs = ranges()
    expect(rs.length).toBeGreaterThan(10)
    for (const [a, b] of rs) expect(a).toBeLessThanOrEqual(b)
  })

  it('covers every character the site copy and components use', () => {
    const rs = ranges()
    const covered = (cp: number) => rs.some(([a, b]) => cp >= a && cp <= b)
    const src = join(__dirname, '..')
    const missing = new Map<string, string>()
    for (const file of [...files(join(src, 'i18n/messages')), ...files(join(src, 'components')), ...files(join(src, 'app')), ...files(join(src, 'lib'))]) {
      for (const ch of readFileSync(file, 'utf8')) {
        const cp = ch.codePointAt(0)!
        if (cp <= 0x7e || notGeist(cp) || covered(cp)) continue
        if (!missing.has(ch)) missing.set(ch, `U+${cp.toString(16).toUpperCase().padStart(4, '0')} in ${file.slice(src.length + 1)}`)
      }
    }
    expect([...missing.values()]).toEqual([])
  })
})
