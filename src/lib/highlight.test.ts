import { describe, expect, it } from 'vitest'
import { highlight } from './highlight'

describe('highlight', () => {
  it('colours tokens with both themes as CSS variables, no fixed colour', async () => {
    const html = await highlight('const answer = 42', 'typescript')
    expect(html).toMatch(/^<pre class="shiki shiki-themes github-light-default github-dark-default"/)
    expect(html).toContain('--shiki-light:')
    expect(html).toContain('--shiki-dark:')
    // defaultColor: false — a literal `color:` would pin one theme and the
    // `.dark` rules in globals.css could not switch it.
    expect(html).not.toMatch(/[";]color:/)
  })

  it('splits a keyword into its own token', async () => {
    const html = await highlight('const answer = 42', 'typescript')
    expect(html).toMatch(/<span style="[^"]+">const<\/span>/)
  })

  // CodeBlock.tsx renders this with dangerouslySetInnerHTML, so the only tags
  // allowed in the output are Shiki's own. Any other `<` must be escaped.
  const onlyShikiTags = (html: string) => !/<(?!\/?(?:pre|code|span)[\s>])/.test(html)

  it('escapes the code, so a post cannot inject markup', async () => {
    const html = await highlight('<script>alert(1)</script> & "x"', 'html')
    expect(onlyShikiTags(html)).toBe(true)
    expect(html).toContain('&#x3C;') // the `<` of <script>, escaped
    expect(html).toContain('&#x26;') // the `&`
  })

  it('escapes in plain mode too', async () => {
    const html = await highlight('<img src=x onerror=alert(1)></code></pre><b>', 'plaintext')
    expect(onlyShikiTags(html)).toBe(true)
    // An unescaped </code></pre> would pass the check above; the counts would not.
    expect(html.match(/<\/?pre[\s>]/g)).toHaveLength(2)
    expect(html.match(/<\/?code[\s>]/g)).toHaveLength(2)
  })

  it('renders an unknown or missing language as plain text instead of throwing', async () => {
    for (const lang of ['cameligo', 'not-a-language', '', undefined, null]) {
      const html = await highlight('just text', lang)
      expect(html, String(lang)).toContain('just text')
    }
  })

  it('maps editor ids Shiki spells differently, and colours them', async () => {
    const html = await highlight('SELECT 1', 'pgsql')
    expect(html).toMatch(/<span style="[^"]+">SELECT<\/span>/)
  })

  it('keeps every line of a multi-line block', async () => {
    const html = await highlight('a = 1\nb = 2\nc = 3', 'python')
    expect(html.match(/class="line"/g)).toHaveLength(3)
  })
})

describe('highlight contrast', () => {
  // --bg-elevated in globals.css, the background every block sits on. If that
  // token changes, change these and let the test say whether the themes still hold.
  const BG = { light: '#f5f5f5', dark: '#171717' }

  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }

  // Comments, keywords, strings, numbers, functions, types, decorators,
  // template parts — enough grammar to make each theme use its whole palette.
  const SAMPLES: [string, string][] = [
    ['sql', "-- comment\nSELECT DATEDIFF(day, start_date, '2000-01-02') AS n FROM t WHERE x = 1 AND y IS NULL"],
    ['typescript', '// comment\nimport { a } from "b"\nexport const f = async <T,>(x: T): Promise<void> => { if (!x) throw new Error(`bad ${x}`) }'],
    ['python', '# comment\n@decorator\ndef f(x: int) -> str:\n    """doc"""\n    return f"{x}" if x > 0 else None'],
    ['shell', '# comment\nexport FOO="bar" && npm run build -- --flag $HOME | grep -E "x"'],
    ['yaml', '# comment\non:\n  push:\n    branches: [main]\nenv:\n  KEY: "value"\n  N: 3'],
    ['csharp', '// comment\npublic async Task<int> Run(string s) { var x = 1; return await Foo(s, x, true, null); }'],
  ]

  it('meets WCAG AA (4.5:1) for every token colour, in both themes', async () => {
    const failures: string[] = []
    for (const [lang, code] of SAMPLES) {
      const html = await highlight(code, lang)
      for (const mode of ['light', 'dark'] as const) {
        for (const [, colour] of html.matchAll(new RegExp(`--shiki-${mode}:(#[0-9a-fA-F]{6})`, 'g'))) {
          const ratio = contrast(colour.toLowerCase(), BG[mode])
          if (ratio < 4.5) failures.push(`${lang} ${mode} ${colour} ${ratio.toFixed(2)}`)
        }
      }
    }
    expect([...new Set(failures)]).toEqual([])
  })

  it('swaps the light theme comment grey for the darker one', async () => {
    const html = await highlight('-- a comment', 'sql')
    expect(html.toLowerCase()).toContain('--shiki-light:#59636e')
    expect(html.toLowerCase()).not.toContain('#6e7781')
  })
})
