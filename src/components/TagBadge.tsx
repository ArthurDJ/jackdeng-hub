// next-intl's Link, which adds the current locale to these locale-less hrefs.
// next/link left them bare, so every click cost a 307 through the middleware
// (and, with cookies blocked, landed in whichever locale the browser preferred).
import { Link } from '@/i18n/navigation'

interface TagBadgeProps {
  name: string
  slug: string
  color?: string
  /** When true the badge is not a link (e.g. inside a card that is already a link) */
  static?: boolean
}

/**
 * Renders a coloured pill for a blog tag.
 * Background is a 12% opacity version of the tag's hex colour; the dot carries
 * the colour itself.
 *
 * The label is the tag colour mixed 35/65 into --text-primary, so it keeps the
 * hue and still reads in both themes. It used to be the raw brand colour,
 * which on the light theme's white put JavaScript's yellow at 1.3:1 and
 * React's cyan at 1.5:1. Every tag colour in use clears 5:1 after the mix.
 */
export function TagBadge({ name, slug, color = '#3B82F6', static: isStatic }: TagBadgeProps) {
  const hex = color.replace('#', '')
  
  let r = 59, g = 130, b = 246
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16)
    g = parseInt(hex.slice(2, 4), 16)
    b = parseInt(hex.slice(4, 6), 16)
  }

  // Calculate perceived luminance (ITU-R BT.709)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  // A near-black dot disappears on the dark theme; draw it in the text colour
  const isTooDark = luminance < 0.2

  const style = {
    backgroundColor: `rgba(${r},${g},${b},0.12)`,
    borderColor: `rgba(${r},${g},${b},0.35)`,
  }

  const inner = (
    <span
      style={style}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: isTooDark ? 'currentColor' : color }}
        aria-hidden
      />
      <span style={{ color: `color-mix(in srgb, ${color} 35%, var(--text-primary))` }}>{name}</span>
    </span>
  )

  if (isStatic) return inner

  return (
    <Link href={`/blog/tag/${slug}`} className="hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  )
}
