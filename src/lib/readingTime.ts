type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
}

function countWords(node: LexicalNode): number {
  if (typeof node.text === 'string' && node.text.length > 0) {
    return node.text.trim().split(/\s+/).filter(Boolean).length
  }
  if (Array.isArray(node.children)) {
    return node.children.reduce((sum, child) => sum + countWords(child), 0)
  }
  return 0
}

/**
 * Estimate reading time in minutes from a Lexical JSON content tree.
 * Uses 200 wpm average. Returns at least 1.
 */
export function readingTime(content: unknown): number {
  if (!content || typeof content !== 'object') return 1
  const words = countWords(content as LexicalNode)
  return Math.max(1, Math.ceil(words / 200))
}
