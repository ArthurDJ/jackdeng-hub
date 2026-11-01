/**
 * Renders Payload Lexical rich-text JSON as React JSX.
 *
 * Pass `withHeadingIds` to inject slugified `id` attributes on every heading
 * so that the TableOfContents component can anchor-link and observe them.
 *
 * A server component. It was `'use client'` from the first commit for no
 * stated reason, which shipped Payload's whole Lexical-to-JSX converter set
 * to the browser and re-rendered each post there from its JSON. Payload's
 * RichText has no hooks and runs on the server as is, and rendering here is
 * what lets code blocks be highlighted on the server (CodeBlock.tsx).
 */

import React from 'react'
import Image from 'next/image'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import { slugifyHeading } from '@/lib/extractHeadings'
import { CodeBlock } from '@/components/CodeBlock'

// ── helpers ────────────────────────────────────────────────────────────────

function getNodeText(node: any): string {
  if (node.type === 'text') return node.text ?? ''
  if (Array.isArray(node.children)) return (node.children as any[]).map(getNodeText).join('')
  return ''
}

// ── converters ─────────────────────────────────────────────────────────────

/**
 * Tables. Payload's default converter puts every row in <tbody>, header row
 * included, with an inline `1px solid #ccc` border, so the prose-ds table
 * styles (tokens, both themes) never applied. Header rows go in <thead> here
 * and take their look from the typography plugin; the wrapper scrolls a wide
 * table sideways instead of widening the page on a phone.
 */
const tableConverters = {
  table: ({ node, nodesToJSX }: any) => {
    const rows: any[] = node.children ?? []
    const isHeader = (row: any) => (row.children ?? []).every((cell: any) => cell.headerState > 0)
    const head = rows.filter(isHeader)
    const body = rows.filter((row) => !isHeader(row))
    return (
      <div className="ds-table-scroll">
        <table>
          {head.length > 0 && <thead>{nodesToJSX({ nodes: head })}</thead>}
          <tbody>{nodesToJSX({ nodes: body })}</tbody>
        </table>
      </div>
    )
  },
  tablerow: ({ node, nodesToJSX }: any) => <tr>{nodesToJSX({ nodes: node.children })}</tr>,
  tablecell: ({ node, nodesToJSX }: any) => {
    const Tag = node.headerState > 0 ? 'th' : 'td'
    return (
      <Tag colSpan={node.colSpan > 1 ? node.colSpan : undefined} rowSpan={node.rowSpan > 1 ? node.rowSpan : undefined}>
        {nodesToJSX({ nodes: node.children })}
      </Tag>
    )
  },
}

/**
 * The article column: the container is 1024px less 24px padding a side, and
 * from 1024px up it shares the row with the 260px sidebar across a 48px gap
 * (src/app/[locale]/blog/[slug]/page.tsx). Below that it is the viewport less
 * the padding.
 */
export const ARTICLE_IMAGE_SIZES = '(min-width: 1024px) 668px, calc(100vw - 48px)'

/**
 * Images in the body (upload nodes, which scripts/lib/markdown.ts writes and
 * the admin editor inserts). The node carries the alt text and caption in the
 * post's language (UploadFeature fields in payload.config.ts); Media.alt is
 * the fallback for an upload inserted without one. The original file is used,
 * not a named size: those are cropped to 16:9, which would cut a screenshot or
 * a diagram. Its width and height give the box its aspect ratio before it
 * loads, and next/image lazy-loads it and serves a width that fits the column.
 *
 * Nothing is rendered when the media row is not there: a query at depth 0
 * leaves `value` as a bare id, and a deleted row comes back as null.
 */
export function UploadFigure({ node }: { node: any }) {
  const media = node?.value && typeof node.value === 'object' ? node.value : null
  if (!media?.url || (media.mimeType && !String(media.mimeType).startsWith('image/'))) return null
  const alt: string = node.fields?.alt || media.alt || ''
  const caption: string | undefined = node.fields?.caption || undefined
  return (
    <figure className="ds-figure">
      {media.width && media.height ? (
        <Image src={media.url} alt={alt} width={media.width} height={media.height} sizes={ARTICLE_IMAGE_SIZES} />
      ) : (
        // No dimensions to give next/image (a row it did not measure): a
        // plain lazy image still fits the column.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.url} alt={alt} loading="lazy" decoding="async" />
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

/** Converter for Code blocks (highlighted on the server, with a copy button), tables and images */
const codeBlockConverter: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...tableConverters,
  upload: ({ node }: any) => <UploadFigure node={node} />,
  blocks: {
    ...((defaultConverters as any).blocks ?? {}),
    Code: ({ node }: any) => {
      const { code = '', language = '' } = node.fields ?? {}
      return <CodeBlock key={node.id} code={code} language={language || undefined} />
    },
  },
})

/** Heading converter that adds a stable slug `id` + code block copy button */
const headingIdsConverters: JSXConvertersFunction = ({ defaultConverters }) => {
  const seenIds = new Map<string, number>()
  const base = codeBlockConverter({ defaultConverters })
  return {
    ...base,
    heading: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children })
      const NodeTag = node.tag as React.ElementType
      const text = getNodeText(node).trim()
      let id = slugifyHeading(text)
      const count = seenIds.get(id) ?? 0
      seenIds.set(id, count + 1)
      if (count > 0) id = `${id}-${count}`
      return <NodeTag id={id}>{children}</NodeTag>
    },
  }
}

// ── component ──────────────────────────────────────────────────────────────

interface LexicalRendererProps {
  content: any
  className?: string
  /** When true, adds slug `id` attributes to all heading nodes (for TOC). */
  withHeadingIds?: boolean
}

export function LexicalRenderer({ content, className, withHeadingIds }: LexicalRendererProps) {
  if (!content) return null

  return (
    <div
      className={`
        prose prose-ds max-w-none
        prose-headings:font-semibold
        prose-a:no-underline hover:prose-a:underline
        prose-code:before:content-none prose-code:after:content-none
        prose-code:bg-[var(--bg-elevated)]
        prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        ${className ?? ''}
      `}
    >
      <RichText
        data={content}
        converters={withHeadingIds ? headingIdsConverters : codeBlockConverter}
      />
    </div>
  )
}
