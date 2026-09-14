/**
 * Markdown to Lexical, for the subset of markdown the posts in this repo use:
 * headings, paragraphs, bullet lists, and inline **bold**, `code` and
 * [text](url).
 *
 * Extracted from scripts/publish-drafts.ts so it can be tested. Two defects
 * reached the production database before it was: links were left to the
 * plain-text path and stored as literal bracket syntax, and bullet lists were
 * folded into one run-on paragraph. Both are covered by the tests next to this
 * file.
 */

// ── Markdown -> Lexical ─────────────────────────────────────────────────────
const textNode = (text: string, format = 0) => ({
  detail: 0, format, mode: 'normal', style: '', text, type: 'text', version: 1,
})

/**
 * Inline markup: **bold**, `code`, and [text](url). Links become Lexical link
 * nodes — leaving them to the plain-text path stores the bracket syntax
 * verbatim, which is what happened to the first post written by this script.
 */
export function inline(md: string) {
  const out: any[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  for (const m of md.matchAll(re)) {
    const i = m.index!
    if (i > last) out.push(textNode(md.slice(last, i)))
    const tok = m[0]
    if (tok.startsWith('**')) {
      out.push(textNode(tok.slice(2, -2), 1))
    } else if (tok.startsWith('`')) {
      out.push(textNode(tok.slice(1, -1), 16))
    } else {
      const link = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!
      out.push({
        type: 'link',
        fields: { linkType: 'custom', newTab: true, url: link[2] },
        format: '', indent: 0, version: 3, direction: 'ltr',
        children: [textNode(link[1])],
      })
    }
    last = i + tok.length
  }
  if (last < md.length) out.push(textNode(md.slice(last)))
  return out.length ? out : [textNode('')]
}

const paragraph = (text: string) => ({
  type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
  textFormat: 0, children: inline(text),
})

/**
 * Line-based rather than block-based. Splitting only on blank lines folded a
 * bullet list into one run-on paragraph, because every newline inside a block
 * was replaced with a space and the hyphens stayed in the text.
 */
export function toLexical(md: string) {
  const children: any[] = []
  const lines = md.split('\n')
  let para: string[] = []
  let items: any[] = []

  const flushPara = () => {
    if (para.length) children.push(paragraph(para.join(' ')))
    para = []
  }
  const flushList = () => {
    if (items.length) {
      children.push({
        type: 'list', listType: 'bullet', tag: 'ul', start: 1,
        format: '', indent: 0, version: 1, direction: 'ltr', children: items,
      })
    }
    items = []
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (!line || line === '---') { flushPara(); flushList(); continue }
    if (line.startsWith('# ')) { flushPara(); flushList(); continue } // H1 is the title field

    const bullet = line.match(/^[-*]\s+(.*)$/)
    if (bullet) {
      flushPara()
      items.push({
        type: 'listitem', value: items.length + 1,
        format: '', indent: 0, version: 1, direction: 'ltr',
        children: inline(bullet[1]),
      })
      continue
    }
    flushList()

    const h = line.match(/^(#{2,3})\s+(.*)$/)
    if (h) {
      flushPara()
      children.push({
        type: 'heading', tag: h[1].length === 2 ? 'h2' : 'h3',
        format: '', indent: 0, version: 1, direction: 'ltr',
        children: inline(h[2]),
      })
      continue
    }
    para.push(line)
  }
  flushPara()
  flushList()

  return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } }
}
