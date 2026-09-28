'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'

interface CodeBlockRendererProps {
  code: string
  language?: string
}

export function CodeBlockRenderer({ code, language }: CodeBlockRendererProps) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations('common')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-6">
      {language && (
        <span className="absolute top-2 left-3 text-xs text-[var(--text-tertiary)] font-mono select-none">
          {language}
        </span>
      )}
      <button
        onClick={handleCopy}
        aria-label={copied ? t('copied') : t('copyCode')}
        className="
          absolute top-2 right-2
          px-2 py-1 rounded text-xs font-mono
          bg-[var(--bg-elevated)] text-[var(--text-secondary)]
          opacity-0 group-hover:opacity-100 focus-visible:opacity-100
          hover:text-[var(--text-primary)]
          transition-opacity duration-150
        "
      >
        {copied ? `✓ ${t('copied')}` : t('copy')}
      </button>
      <pre className="overflow-x-auto rounded-lg bg-[var(--bg-elevated)] px-4 pt-8 pb-4 text-sm leading-relaxed">
        <code className={language ? `language-${language}` : undefined}>
          {code}
        </code>
      </pre>
    </div>
  )
}
