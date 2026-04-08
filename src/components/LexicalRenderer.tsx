'use client'

/**
 * Renders Payload Lexical rich-text JSON as React JSX.
 *
 * Import this in Server Components via dynamic() if you need code-highlighting
 * or other browser-only features, otherwise it's safe to use directly as a
 * React Server Component wrapper.
 */

import { RichText } from '@payloadcms/richtext-lexical/react'

interface LexicalRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
  className?: string
}

export function LexicalRenderer({ content, className }: LexicalRendererProps) {
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
      <RichText data={content} />
    </div>
  )
}
