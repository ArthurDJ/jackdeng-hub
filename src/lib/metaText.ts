import type { Metadata } from 'next'

// Search results cut a title at about 60 characters and a description at
// about 160 (roughly half that for Chinese, whose characters are twice as
// wide), mid-word. Project short descriptions, post excerpts and tool
// descriptions are written for the page, not for the result, and several ran
// past that, so metadata built from them goes through here.

const LIMITS = {
  en: { title: 60, description: 160 },
  zh: { title: 32, description: 80 },
} as const

const SUFFIX = ' — Jack Deng'

const limits = (locale: string) => (locale === 'zh' ? LIMITS.zh : LIMITS.en)

/**
 * A description that fits: unchanged when short enough, else cut at the last
 * sentence end within the limit, else at the last clause break (with "…"),
 * else at the last space (with "…"). A cut never lands in the first half, so
 * a long first sentence is not reduced to a few words.
 */
export function fitDescription(text: string, locale: string): string {
  const max = limits(locale).description
  const s = text.trim().replace(/\s+/g, ' ')
  if (s.length <= max) return s
  const head = s.slice(0, max)
  const floor = Math.floor(max / 2)
  const lastOf = (re: RegExp) => {
    let at = -1
    for (const m of head.matchAll(re)) at = m.index + m[0].length
    return at
  }
  const sentence = lastOf(/[.!?](?=\s)|[。！？]/g)
  if (sentence > floor) return head.slice(0, sentence).trim()
  // Room is kept for the ellipsis, so the result never runs past the limit.
  const room = head.slice(0, max - 1)
  const clause = Math.max(room.lastIndexOf(', '), room.lastIndexOf('; '), room.lastIndexOf('，'), room.lastIndexOf('；'), room.lastIndexOf('：'))
  if (clause > floor) return `${room.slice(0, clause)}…`
  const space = room.lastIndexOf(' ')
  return `${(space > floor ? room.slice(0, space) : room).trimEnd()}…`
}

/**
 * The page title for the layout's `%s — Jack Deng` template, or the bare
 * title (`absolute`) when the suffix would push it past the limit: the name is
 * in the URL and on the card, the end of the title is not anywhere else.
 */
export function pageTitle(title: string, locale: string): Metadata['title'] {
  return title.length + SUFFIX.length > limits(locale).title ? { absolute: title } : title
}
