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
import { CodeBlockRenderer } from '@/components/CodeBlockRenderer'

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

/** Converter for CodeBlock blocks (adds copy button) and tables */
const codeBlockConverter: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...tableConverters,
  blocks: {
    ...((defaultConverters as any).blocks ?? {}),
    Code: ({ node }: any) => {
      const { code = '', language = '' } = node.fields ?? {}
      return <CodeBlockRenderer key={node.id} code={code} language={language || undefined} />
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
        converters={withHeadingIds ? headingIdsConverters : codeBlockConverter}
      />
    </div>
  )
}
