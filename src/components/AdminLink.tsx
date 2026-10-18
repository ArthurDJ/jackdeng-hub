'use client'

import { useEffect, useState } from 'react'
import { hasEditorHint } from '@/lib/editorHint'

/**
 * The footer's link to /admin, shown only in a browser that is signed in
 * there (src/lib/editorHint.ts). Visitors never see it. Decided after
 * hydration, so the cached page is the same for everyone.
 *
 * A plain <a>: /admin sits outside the locale routes, and the i18n Link
 * would prefix it.
 */
export function AdminLink({ label, className }: { label: string; className?: string }) {
  const [signedIn, setSignedIn] = useState(false)
  // Reading a client-only value after hydration, which is the whole design:
  // the cached HTML has to be identical for everyone, so the cookie can only
  // be consulted once the browser has it. One extra render on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSignedIn(hasEditorHint(document.cookie)), [])
  if (!signedIn) return null
  return (
    <a href="/admin" className={className} style={{ color: 'var(--text-tertiary)' }}>
      {label}
    </a>
  )
}
