import 'server-only'

import { highlight } from '@/lib/highlight'
import { CopyCodeButton } from '@/components/CopyCodeButton'

interface CodeBlockProps {
  code: string
  language?: string
}

/**
 * The editor's Code block, highlighted on the server (src/lib/highlight.ts).
 *
 * This used to be a client component that rendered the code as plain text,
 * so every block shipped its source twice (HTML and the RSC payload) and was
 * never coloured. Now the colouring happens once, on the server, and the only
 * client code is the copy button. `server-only` keeps Shiki out of the client
 * bundle: importing this from a client component fails the build.
 *
 * Shiki returns the whole <pre>; its look (background, padding, the two
 * themes) lives in `.ds-code` in globals.css.
 */
export async function CodeBlock({ code, language }: CodeBlockProps) {
  const html = await highlight(code, language)

  return (
    <div className="ds-code relative group my-6">
      {language && (
        <span className="absolute top-2 left-3 z-10 text-xs text-[var(--text-tertiary)] font-mono select-none">
          {language}
        </span>
      )}
      <CopyCodeButton code={code} />
      {/* Shiki escapes the code it is given; the only markup here is its own. */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
