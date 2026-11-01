import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// CodeBlock (highlighting on the server) guards itself with server-only,
// which throws outside a React Server Components build.
vi.mock('server-only', () => ({}))

// The real next/image: its markup (srcset through /_next/image, sizes, lazy
// loading, width and height) is what this file checks.
const { LexicalRenderer, ARTICLE_IMAGE_SIZES } = await import('./LexicalRenderer')

const media = {
  id: 7,
  url: 'https://store.public.blob.vercel-storage.com/pipeline.png',
  alt: 'Media-level alt',
  mimeType: 'image/png',
  width: 1200,
  height: 800,
}

const upload = (value: unknown, fields?: Record<string, string>) => ({
  type: 'upload', version: 3, format: '', id: '0123456789abcdef01234567',
  relationTo: 'media', value, fields,
})

const doc = (...children: unknown[]) => ({
  root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children },
})

const render = (...children: unknown[]) =>
  renderToStaticMarkup(createElement(LexicalRenderer, { content: doc(...children) }))

describe('LexicalRenderer: images', () => {
  it('renders an upload as a figure with a lazy, responsive next/image and its caption', () => {
    const html = render(upload(media, { alt: 'A three-stage pipeline', caption: 'Figure 1. The pipeline' }))
    expect(html).toContain('<figure class="ds-figure"><img ')
    const img = html.match(/<img [^>]*>/)![0]
    expect(img).toContain('alt="A three-stage pipeline"')
    expect(img).toContain('width="1200"')
    expect(img).toContain('height="800"')
    expect(img).toContain('loading="lazy"')
    expect(img).toContain(`sizes="${ARTICLE_IMAGE_SIZES}"`)
    expect(img).toContain(`/_next/image?url=${encodeURIComponent(media.url)}`)
    expect(html).toContain('<figcaption>Figure 1. The pipeline</figcaption></figure>')
  })

  it('leaves the caption out when the node has none, and falls back to Media.alt', () => {
    const html = render(upload(media, {}))
    expect(html).not.toContain('<figcaption')
    expect(html).toContain('alt="Media-level alt"')
  })

  it('uses the alt on the node for each locale, not the shared media row', () => {
    expect(render(upload(media, { alt: '三段式管道' }))).toContain('alt="三段式管道"')
  })

  it('renders nothing for an unpopulated or deleted media row', () => {
    // depth 0 leaves a bare id; a deleted row is populated as null.
    for (const value of [7, null]) {
      const html = render({ type: 'paragraph', version: 1, children: [{ type: 'text', text: 'before', format: 0, version: 1 }] }, upload(value))
      expect(html).toContain('before')
      expect(html).not.toContain('<figure')
      expect(html).not.toContain('<img')
    }
  })

  it('falls back to a plain lazy img when the row has no dimensions', () => {
    const html = render(upload({ ...media, width: null, height: null }, { alt: 'x' }))
    expect(html).toContain(`<img src="${media.url}" alt="x" loading="lazy" decoding="async"/>`)
  })
})
