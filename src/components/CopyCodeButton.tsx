'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

/**
 * The one interactive part of a code block. The block itself is a server
 * component (CodeBlock.tsx), so this button is all the JavaScript a code
 * block costs the browser.
 *
 * Hidden until hover or keyboard focus where a pointer can hover, always
 * shown where it cannot. Tailwind v4 wraps `hover:` in `@media (hover: hover)`,
 * so on a touchscreen `group-hover:opacity-100` never applied and the button
 * sat at opacity 0 — tappable, but nobody knew it was there.
 */
export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations('common')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // No clipboard access (an insecure context, a denied permission): leave
      // the label alone rather than claim a copy that did not happen.
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? t('copied') : t('copyCode')}
      className="
        absolute top-2 right-2 z-10
        px-2 py-1 rounded text-xs font-mono
        bg-[var(--bg-elevated)] text-[var(--text-secondary)]
        opacity-0 group-hover:opacity-100 focus-visible:opacity-100
        [@media(hover:none)]:opacity-100
        hover:text-[var(--text-primary)]
        transition-opacity duration-150
      "
    >
      {copied ? `✓ ${t('copied')}` : t('copy')}
    </button>
  )
}
