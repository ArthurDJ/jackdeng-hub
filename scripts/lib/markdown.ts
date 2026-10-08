/**
 * Markdown to Lexical, for the subset of markdown the posts in this repo use:
 * headings, paragraphs, bullet and numbered lists, fenced code blocks, tables,
 * and inline **bold**, `code` (``with a ` inside``) and [text](url).
 *
 * Extracted from scripts/publish-drafts.ts so it can be tested. Two defects
 * reached the production database before it was: links were left to the
 * plain-text path and stored as literal bracket syntax, and bullet lists were
 * folded into one run-on paragraph. Both are covered by the tests next to this
 * file.
 */

import { CodeBlock } from '@payloadcms/richtext-lexical'

// ── Markdown -> Lexical ─────────────────────────────────────────────────────
const textNode = (text: string, format = 0) => ({
  detail: 0, format, mode: 'normal', style: '', text, type: 'text', version: 1,
})

/**
 * Inline markup: **bold**, `code`, and [text](url). Links become Lexical link
 * nodes — leaving them to the plain-text path stores the bracket syntax
 * verbatim, which is what happened to the first post written by this script.
 * A code span that contains a backtick is written with two, as in markdown:
 * `` `Column Name` ``.
 */
export function inline(md: string) {
  const out: any[] = []
  const re = /(\*\*[^*]+\*\*|``\s?.+?\s?``|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  for (const m of md.matchAll(re)) {
    const i = m.index!
    if (i > last) out.push(textNode(md.slice(last, i)))
    const tok = m[0]
    if (tok.startsWith('**')) {
      out.push(textNode(tok.slice(2, -2), 1))
    } else if (tok.startsWith('``')) {
      out.push(textNode(tok.slice(2, -2).trim(), 16))
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
 * A fenced code block becomes the editor's Code block (BlocksFeature with
 * CodeBlock() in payload.config.ts), which the site renders with a copy
 * button. The id only has to be unique within the document, as Payload's own
 * ObjectID-shaped ones are.
 */
/**
 * The languages the editor's Code block accepts, read from its own select
 * field so the list cannot drift. A fence tagged with anything else (```ts)
 * used to pass the dry run and then fail the write with "invalid choice".
 */
const CODE_LANGUAGES = new Set<string>(
  ((CodeBlock().fields as any[]).find((f) => f.name === 'language')?.options ?? []).map(
    (o: { value: string }) => o.value,
  ),
)

/** Short fence tags people write, mapped to the editor's names. */
const LANGUAGE_ALIASES: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  sh: 'shell', bash: 'shell', zsh: 'shell', yml: 'yaml', py: 'python',
  cs: 'csharp', 'c#': 'csharp', md: 'markdown', text: 'plaintext', txt: 'plaintext',
}

export function codeLanguage(tag: string): string {
  const lang = LANGUAGE_ALIASES[tag.toLowerCase()] ?? (tag.toLowerCase() || 'plaintext')
  if (!CODE_LANGUAGES.has(lang)) {
    throw new Error(`code fence language "${tag}" is not one the editor accepts`)
  }
  return lang
}

const codeBlock = (code: string, language: string) => ({
  type: 'block', version: 2, format: '',
  fields: {
    id: Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    blockName: '', blockType: 'Code', language, code,
  },
})

/**
 * A GitHub-style table: a header row, a |---| separator, then body rows. It
 * becomes @lexical/table nodes, the ones EXPERIMENTAL_TableFeature edits; the
 * first row is a header row (headerState 1, TableCellHeaderStates.ROW).
 */
const tableCells = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
const table = (rows: string[][]) => ({
  type: 'table', version: 1, format: '', indent: 0, direction: null,
  children: rows.map((cells, r) => ({
    type: 'tablerow', version: 1, format: '', indent: 0, direction: null,
    children: cells.map((cell) => ({
      type: 'tablecell', version: 1, format: '', indent: 0, direction: null,
      headerState: r === 0 ? 1 : 0, colSpan: 1, rowSpan: 1, backgroundColor: null,
      children: [paragraph(cell)],
    })),
  })),
})
const isSeparator = (line: string) => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(line)

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
  let listType: 'bullet' | 'number' = 'bullet'
  let code: { language: string; lines: string[] } | null = null
  let rows: string[][] = []

  const flushPara = () => {
    if (para.length) children.push(paragraph(para.join(' ')))
    para = []
  }
  const flushList = () => {
    if (items.length) {
      children.push({
        type: 'list', listType, tag: listType === 'number' ? 'ol' : 'ul', start: 1,
        format: '', indent: 0, version: 1, direction: 'ltr', children: items,
      })
    }
    items = []
  }
  const flushTable = () => {
    // Without the separator line it was never a table, just lines with pipes.
    if (rows.length >= 2 && rows[1].every((c) => /^:?-{3,}:?$/.test(c))) {
      children.push(table([rows[0], ...rows.slice(2)]))
    } else {
      rows.forEach((r) => para.push(r.join(' | ')))
    }
    rows = []
  }

  for (const raw of lines) {
    // Inside a fence every line is kept as written, indentation and all.
    if (code) {
      if (raw.trim().startsWith('```')) {
        children.push(codeBlock(code.lines.join('\n'), code.language))
        code = null
      } else {
        code.lines.push(raw)
      }
      continue
    }
    const line = raw.trim()

    if (line.startsWith('```')) {
      flushPara(); flushList(); flushTable()
      code = { language: codeLanguage(line.slice(3).trim()), lines: [] }
      continue
    }
    if (line.startsWith('|') || (rows.length && isSeparator(line))) {
      flushPara(); flushList()
      rows.push(tableCells(line))
      continue
    }
    flushTable()

    if (!line || line === '---') { flushPara(); flushList(); continue }
    if (line.startsWith('# ')) { flushPara(); flushList(); continue } // H1 is the title field

    const bullet = line.match(/^[-*]\s+(.*)$/)
    const numbered = line.match(/^\d+\.\s+(.*)$/)
    if (bullet || numbered) {
      flushPara()
      const type = numbered ? 'number' : 'bullet'
      if (items.length && type !== listType) flushList()
      listType = type
      items.push({
        type: 'listitem', value: items.length + 1,
        format: '', indent: 0, version: 1, direction: 'ltr',
        children: inline((bullet ?? numbered)![1]),
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
  if (code) throw new Error('unclosed ``` code fence')
  flushTable()
  flushPara()
  flushList()

  return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } }
}
