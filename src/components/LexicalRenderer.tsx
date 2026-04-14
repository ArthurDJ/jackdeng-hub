'use client'

/**
 * Renders Payload Lexical rich-text JSON as React JSX.
 *
 * Pass `withHeadingIds` to inject slugified `id` attributes on every heading
 * so that the TableOfContents component can anchor-link and observe them.
 */

import React from 'react'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import { slugifyHeading } from '@/lib/extractHeadings'

// ── helpers ────────────────────────────────────────────────────────────────

function getNodeText(node: any): string {
  if (node.type === 'text') return node.text ?? ''
  if (Array.isArray(node.children)) return (node.children as any[]).map(getNodeText).join('')
  return ''
}

// ── converters ─────────────────────────────────────────────────────────────

/** Heading converter that adds a stable slug `id` for anchor linking */
const headingIdsConverters: JSXConvertersFunction = ({ defaultConverters }) => {
  const seenIds = new Map<string, number>()
  return {
    ...defaultConverters,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        converters={withHeadingIds ? headingIdsConverters : undefined}
      />
    </div>
  )
}
