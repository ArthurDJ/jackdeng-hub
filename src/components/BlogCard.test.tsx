import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// BlogCard is an async Server Component. Stub the three framework seams it
// touches so it can run in plain Node: the locale and translations, next-intl's
// Link (a plain <a> keeps every prop it is given) and next/image.
vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getTranslations: async () => (key: string, values?: { count?: number }) =>
    key === 'minRead' ? `${values?.count} min read` : key === 'featured' ? 'Featured' : key,
}))
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...props }: { children?: ReactNode }) => createElement('a', props, children),
}))
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => createElement('img', { src, alt }),
}))

const { BlogCard } = await import('./BlogCard')

const base = {
  title: 'Planning a flight with Claude',
  slug: 'flight-trip-planning',
  excerpt: 'How the skill works.',
  publishedAt: '2026-09-14T12:00:00Z',
}

const hero = { url: '/media/hero.jpg', alt: 'A plane at the gate', sizes: { card: { url: '/media/hero-card.jpg' } } }

async function render(props: Parameters<typeof BlogCard>[0]) {
  return renderToStaticMarkup(await BlogCard(props))
}

function links(html: string) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attrs, inner]) => ({
    attrs,
    hidden: /\baria-hidden="true"/.test(attrs) && /\btabindex="-1"/.test(attrs),
    text: inner.replace(/<[^>]+>/g, '').trim(),
  }))
}

describe('BlogCard links', () => {
  for (const [name, coverImage] of [['with a hero image', hero], ['without a hero image', null]] as const) {
    it(`has one accessible link, named by the title, ${name}`, async () => {
      const all = links(await render({ ...base, coverImage }))
      const exposed = all.filter((l) => !l.hidden)
      expect(exposed).toHaveLength(1)
      expect(exposed[0].text).toBe(base.title)
      expect(exposed[0].attrs).toContain('href="/blog/flight-trip-planning"')
      // The cover still links to the post for the mouse, out of the tab order
      // and the accessibility tree.
      expect(all.filter((l) => l.hidden)).toHaveLength(1)
    })
  }

  it('hides the placeholder SVG and treats the hero image as decorative', async () => {
    const without = await render({ ...base, coverImage: null })
    const svgs = without.match(/<svg\b[^>]*>/g) ?? []
    expect(svgs.length).toBeGreaterThan(0)
    for (const svg of svgs) expect(svg).toContain('aria-hidden="true"')

    expect(await render({ ...base, coverImage: hero })).toContain('<img src="/media/hero-card.jpg" alt=""/>')
  })

  it('keeps the translated Featured badge outside the hidden link', async () => {
    const html = await render({ ...base, featured: true })
    expect(html).toContain('>Featured</span>')
    for (const l of links(html)) expect(l.text).not.toContain('Featured')
  })
})
