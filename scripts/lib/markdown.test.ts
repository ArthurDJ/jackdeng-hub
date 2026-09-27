import { describe, expect, it } from 'vitest'
import { toLexical, inline } from './markdown'

const children = (md: string) => (toLexical(md) as any).root.children
const texts = (node: any): string =>
  (node.children ?? []).map((c: any) => c.text ?? texts(c)).join('')

describe('inline', () => {
  it('emits a link node rather than literal bracket syntax', () => {
    // The defect this covers reached the production database: a Sources list
    // was stored as "via [kore.ai](https://…)" and rendered as that text.
    const nodes = inline('via [kore.ai](https://kore.ai/blog) today')
    const link = nodes.find((n: any) => n.type === 'link')
    expect(link).toBeDefined()
    expect(link.fields.url).toBe('https://kore.ai/blog')
    expect(link.children[0].text).toBe('kore.ai')
    expect(nodes.map((n: any) => n.text ?? '[link]')).toEqual(['via ', '[link]', ' today'])
  })

  it('marks bold with format 1 and code with format 16', () => {
    const [bold] = inline('**Sources**')
    expect(bold.format).toBe(1)
    expect(bold.text).toBe('Sources')

    const [code] = inline('`--apply`')
    expect(code.format).toBe(16)
    expect(code.text).toBe('--apply')
  })

  it('leaves plain text alone and never returns an empty child list', () => {
    expect(inline('just words')).toEqual([
      expect.objectContaining({ text: 'just words', format: 0 }),
    ])
    expect(inline('')).toHaveLength(1)
  })
})

describe('toLexical', () => {
  it('turns a bullet list into list and listitem nodes', () => {
    // The second production defect: blocks were split on blank lines and every
    // newline inside a block became a space, so four bullets arrived as one
    // run-on paragraph with the hyphens still in the text.
    const nodes = children('**Sources**\n- first\n- second\n- third')
    expect(nodes.map((n: any) => n.type)).toEqual(['paragraph', 'list'])

    const list = nodes[1]
    expect(list.listType).toBe('bullet')
    expect(list.children).toHaveLength(3)
    expect(list.children.map(texts)).toEqual(['first', 'second', 'third'])
    expect(JSON.stringify(nodes)).not.toContain('- first')
  })

  it('keeps links inside list items', () => {
    const list = children('- see [docs](https://example.com)')[0]
    const item = list.children[0]
    expect(item.children.some((c: any) => c.type === 'link')).toBe(true)
  })

  it('maps ## and ### to h2 and h3, and drops the H1 title', () => {
    const nodes = children('# Title\n\n## Two\n\n### Three')
    expect(nodes.map((n: any) => [n.type, n.tag])).toEqual([
      ['heading', 'h2'],
      ['heading', 'h3'],
    ])
  })

  it('joins wrapped lines into one paragraph and splits on blank lines', () => {
    const nodes = children('one line\nstill one\n\nsecond para')
    expect(nodes).toHaveLength(2)
    expect(texts(nodes[0])).toBe('one line still one')
    expect(texts(nodes[1])).toBe('second para')
  })

  it('ends a list when a paragraph follows it', () => {
    const nodes = children('- a\n- b\n\nafter')
    expect(nodes.map((n: any) => n.type)).toEqual(['list', 'paragraph'])
    expect(nodes[0].children).toHaveLength(2)
  })

  it('drops horizontal rules and blank lines', () => {
    expect(children('a\n\n---\n\nb').map((n: any) => n.type)).toEqual(['paragraph', 'paragraph'])
  })

  it('always produces a root with a children array', () => {
    const empty = toLexical('') as any
    expect(empty.root.type).toBe('root')
    expect(empty.root.children).toEqual([])
  })
})

describe('toLexical: code, tables and numbered lists', () => {
  it('turns a fenced block into a Code block, keeping indentation and blank lines', () => {
    const [block] = children('```sql\nselect 1\n\n  from t\n```')
    expect(block.type).toBe('block')
    expect(block.fields.blockType).toBe('Code')
    expect(block.fields.language).toBe('sql')
    expect(block.fields.code).toBe('select 1\n\n  from t')
    expect(block.fields.id).toMatch(/^[0-9a-f]{24}$/)
  })

  it('does not parse markdown inside a fence', () => {
    const nodes = children('```\n- not a list\n| not | a table |\n```')
    expect(nodes).toHaveLength(1)
    expect(nodes[0].fields.code).toBe('- not a list\n| not | a table |')
    expect(nodes[0].fields.language).toBe('plaintext')
  })

  it('refuses an unclosed fence rather than swallowing the rest of the post', () => {
    expect(() => toLexical('```sql\nselect 1')).toThrow(/unclosed/)
  })

  it('turns a table into a header row and body rows', () => {
    const [t] = children('| A | B |\n|---|---|\n| `x` | **y** |\n| 1 | 2 |')
    expect(t.type).toBe('table')
    expect(t.children).toHaveLength(3)
    const [head, first] = t.children
    expect(head.children.map((c: any) => c.headerState)).toEqual([1, 1])
    expect(first.children.map((c: any) => c.headerState)).toEqual([0, 0])
    expect(head.children.map(texts)).toEqual(['A', 'B'])
    // Cell text goes through the inline parser.
    expect(first.children[0].children[0].children[0].format).toBe(16)
    expect(first.children[1].children[0].children[0].format).toBe(1)
  })

  it('leaves pipe lines without a separator as text', () => {
    const nodes = children('| just | pipes |')
    expect(nodes.map((n: any) => n.type)).toEqual(['paragraph'])
  })

  it('turns 1. 2. 3. into a numbered list, apart from an adjacent bullet list', () => {
    const [ol, ul] = children('1. one\n2. two\n- three')
    expect(ol.listType).toBe('number')
    expect(ol.tag).toBe('ol')
    expect(ol.children.map(texts)).toEqual(['one', 'two'])
    expect(ul.listType).toBe('bullet')
  })
})

describe('inline: double-backtick code', () => {
  it('keeps a backtick inside the code span', () => {
    const [code] = inline('`` `Column Name` ``')
    expect(code.format).toBe(16)
    expect(code.text).toBe('`Column Name`')
  })
})
