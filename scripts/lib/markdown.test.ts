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
