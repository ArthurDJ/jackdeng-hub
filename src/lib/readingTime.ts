type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
}

// CJK ideographs plus the kana blocks, which are the scripts this site actually
// carries. These are not separated by spaces, so splitting on whitespace counts
// a whole Chinese paragraph as one word.
const CJK = /[぀-ヿ㐀-䶿一-鿿豈-﫿]/g

type Counts = { words: number; cjk: number }

function count(node: LexicalNode, acc: Counts): Counts {
  if (typeof node.text === 'string' && node.text.length > 0) {
    const cjk = node.text.match(CJK)?.length ?? 0
    acc.cjk += cjk
    // Strip the CJK before counting words so mixed text is not counted twice.
    const rest = node.text.replace(CJK, ' ')
    acc.words += rest.trim().split(/\s+/).filter(Boolean).length
    return acc
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) count(child, acc)
  }
  return acc
}

/**
 * Estimate reading time in minutes from a Lexical JSON content tree.
 *
 * Two rates, because the two scripts do not read at the same speed: 200 words
 * per minute for space-delimited text and 400 characters per minute for CJK,
 * which is the middle of the range usually quoted for Chinese prose. A post
 * mixing both adds the two fractions before rounding, so a Chinese article with
 * English technical terms in it is not counted twice or rounded up twice.
 *
 * Returns at least 1.
 */
export function readingTime(content: unknown): number {
  if (!content || typeof content !== 'object') return 1
  // Payload stores the document as { root: { children: [...] } }. Counting from
  // the document itself finds neither text nor children on the top level, so
  // every post reported 0 words and rendered as "1 min read".
  const doc = content as { root?: LexicalNode }
  const { words, cjk } = count(doc.root ?? (content as LexicalNode), { words: 0, cjk: 0 })
  return Math.max(1, Math.ceil(words / 200 + cjk / 400))
}
