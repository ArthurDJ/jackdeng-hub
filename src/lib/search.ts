// Pure search over a prebuilt index. No Payload, no Next — the route builds the
// index (src/lib/searchIndex.ts) and this file only matches and ranks, so it can
// be tested without a database.

export type SearchType = 'post' | 'category' | 'tag' | 'tool' | 'project'

export type SearchDoc = {
  id: string
  type: SearchType
  label: string
  description: string
  /** Locale-less path; the client's next-intl router adds the prefix. */
  href: string
  /** Extra text that should match but is not displayed: tag and category names on a post. */
  keywords: string
  /** Plain-text body. Matches here rank lowest and produce a snippet. */
  body: string
}

export type SearchResult = {
  id: string
  type: SearchType
  label: string
  description: string
  href: string
}

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] }

// Links are the only inline nodes with children. Everything else that has
// children is a block (paragraph, heading, list item, quote), and a block's
// last word must not run into the next block's first.
const INLINE = new Set(['link', 'autolink'])

function walk(node: LexicalNode, out: string[]) {
  if (typeof node.text === 'string') {
    out.push(node.text)
    return
  }
  if (!Array.isArray(node.children)) return
  for (const child of node.children) walk(child, out)
  if (!INLINE.has(node.type ?? '')) out.push(' ')
}

/**
 * Flatten a Lexical document to plain text. Starts from `root` — the same trap
 * readingTime fell into (#23): the document itself has neither text nor children.
 */
export function lexicalToText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const doc = content as { root?: LexicalNode }
  const out: string[] = []
  walk(doc.root ?? (content as LexicalNode), out)
  return out.join('').replace(/\s+/g, ' ').trim()
}

export const MAX_QUERY_LENGTH = 100
const MAX_TERMS = 8

function normalize(s: string): string {
  // NFKC folds full-width Latin (Ｐｏｓｔｇｒｅｓ) into ASCII, which Chinese input
  // methods produce often enough to matter.
  return s.normalize('NFKC').toLowerCase()
}

/**
 * Split a query into terms. Whitespace-separated, because that is the only
 * boundary that means the same thing in both scripts; a Chinese query without
 * spaces is one term and matches as a substring, which is what a reader expects.
 */
export function parseQuery(query: string): string[] {
  const terms = normalize(query.slice(0, MAX_QUERY_LENGTH)).split(/\s+/).filter(Boolean)
  return [...new Set(terms)].slice(0, MAX_TERMS)
}

const WEIGHT = { label: 10, description: 4, keywords: 4, body: 1 } as const

const HAS_CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u

type Matcher = (field: string) => number

/**
 * Latin terms match at the start of a word, so "sand" finds "Sandbox" but not
 * "thousands", and a half-typed "netsu" still finds NetSuite. CJK has no word
 * boundaries to anchor on, so a term containing any of it is a plain substring.
 * Returns the index of the match in `field` (already normalized), or -1.
 */
function matcher(term: string): Matcher {
  if (HAS_CJK.test(term)) return (field) => field.indexOf(term)
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}`, 'u')
  return (field) => field.search(re)
}

const SNIPPET_RADIUS = 40
const SNAP = 15

function snippet(body: string, terms: string[], matchers: Matcher[]): string {
  // First term that is actually in the body — an earlier one may have matched
  // a tag name instead. The index comes from the normalized copy; NFKC and
  // lowercasing keep length for everything this site carries, and a window off
  // by a character would still read fine.
  const folded = normalize(body)
  const i = matchers.findIndex((m) => m(folded) >= 0)
  if (i < 0) return ''
  const term = terms[i]
  const at = matchers[i](folded)
  let start = Math.max(0, at - SNIPPET_RADIUS)
  let end = Math.min(body.length, at + term.length + SNIPPET_RADIUS)
  // Snap the edges to a space so the window does not open on "…e entire".
  // Bounded, because Chinese text may have no space nearby and the context
  // should not collapse to nothing hunting for one.
  const before = body.indexOf(' ', start)
  if (start > 0 && before !== -1 && before < at && before - start <= SNAP) start = before + 1
  const after = body.lastIndexOf(' ', end)
  if (end < body.length && after > at + term.length && end - after <= SNAP) end = after
  return (start > 0 ? '…' : '') + body.slice(start, end).trim() + (end < body.length ? '…' : '')
}

/**
 * Every term must appear somewhere in the document (AND, not OR — with five
 * content types in one list, OR floods it). Score is the sum of the best field
 * each term hit. Ties keep index order, which the builder sets to posts first.
 */
export function search(docs: SearchDoc[], query: string, limit = 12): SearchResult[] {
  const terms = parseQuery(query)
  if (terms.length === 0) return []
  const matchers = terms.map(matcher)

  const scored: { doc: SearchDoc; score: number; bodyOnly: boolean; order: number }[] = []

  docs.forEach((doc, order) => {
    const fields = {
      label: normalize(doc.label),
      description: normalize(doc.description),
      keywords: normalize(doc.keywords),
      body: normalize(doc.body),
    }
    let score = 0
    let shown = false
    for (const m of matchers) {
      if (m(fields.label) >= 0) { score += WEIGHT.label; shown = true }
      else if (m(fields.description) >= 0) { score += WEIGHT.description; shown = true }
      else if (m(fields.keywords) >= 0) score += WEIGHT.keywords
      else if (m(fields.body) >= 0) score += WEIGHT.body
      else return
    }
    scored.push({ doc, score, bodyOnly: !shown, order })
  })

  scored.sort((a, b) => b.score - a.score || a.order - b.order)

  return scored.slice(0, limit).map(({ doc, bodyOnly }) => ({
    id: doc.id,
    type: doc.type,
    label: doc.label,
    // When nothing visible explains why the row is here, show where the body
    // matched instead of an excerpt that does not contain the term.
    description: (bodyOnly && snippet(doc.body, terms, matchers)) || doc.description,
    href: doc.href,
  }))
}
