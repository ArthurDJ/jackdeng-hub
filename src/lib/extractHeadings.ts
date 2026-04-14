/**
 * Extracts headings from a Payload Lexical JSON tree for TOC generation.
 * Runs server-side (no browser APIs needed).
 */

export interface TocHeading {
  id: string
  text: string
  level: number  // 1–6
}

/** Convert heading text to a URL-safe id (supports CJK characters) */
export function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    // Keep word chars, CJK unified ideographs, hyphens, and spaces
    .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'section'
}

/** Recursively collect text content from a Lexical node */
function getNodeText(node: any): string {
  if (node.type === 'text') return node.text ?? ''
  if (Array.isArray(node.children)) {
    return (node.children as any[]).map(getNodeText).join('')
  }
  return ''
}

/** Parse Lexical JSON and return all headings in document order */
export function extractHeadings(content: any): TocHeading[] {
  if (!content?.root?.children) return []
  const headings: TocHeading[] = []
  const seenIds = new Map<string, number>()

  for (const node of content.root.children as any[]) {
    if (node.type !== 'heading' || !node.tag) continue
    const level = parseInt((node.tag as string).replace('h', ''), 10)
    if (isNaN(level)) continue
    const text = getNodeText(node).trim()
    if (!text) continue

    let id = slugifyHeading(text)
    // Deduplicate: "intro", "intro-1", "intro-2", …
    const count = seenIds.get(id) ?? 0
    seenIds.set(id, count + 1)
    if (count > 0) id = `${id}-${count}`

    headings.push({ id, text, level })
  }

  return headings
}
