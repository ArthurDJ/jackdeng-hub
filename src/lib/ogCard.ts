/**
 * The URL of a generated share card (src/app/og/route.tsx), for pages whose
 * link previews have no image of their own. One place builds it, so a change
 * to what /og takes is made once rather than in every page that links it.
 */
export interface OgCard {
  title: string
  /** A line under the title, such as a headline or a description. */
  subtitle?: string
  /** 'blog' draws the blog variant; anything else, the default card. */
  type?: 'blog' | 'project'
}

export function ogCardUrl(base: string, { title, subtitle, type }: OgCard): string {
  let url = `${base}/og?title=${encodeURIComponent(title)}`
  if (subtitle) url += `&subtitle=${encodeURIComponent(subtitle)}`
  if (type) url += `&type=${type}`
  return url
}
