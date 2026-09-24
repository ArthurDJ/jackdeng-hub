'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useCommandPalette } from '@/hooks/useCommandPalette'

// The palette itself (search, results, keyboard navigation) stays out of the
// bundle every page waits on before it is interactive. This host is all that
// ships up front: the ⌘K / Ctrl+K shortcut and the store subscription.
const CommandPalette = dynamic(
  () => import('./CommandPalette').then((m) => m.CommandPalette),
  { ssr: false },
)

export function CommandPaletteHost() {
  const { isOpen } = useCommandPalette()
  const [mounted, setMounted] = useState(false)

  // Mount it, closed, as soon as the browser is idle after load. Mounting on
  // the first ⌘K instead (#60) lost whatever was typed next: the input did
  // not exist until the chunk had loaded and rendered, so a visitor who hit
  // ⌘K and started typing got an empty search box. Idle is still well after
  // the page is interactive, and opening before then mounts it immediately.
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      return
    }
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setMounted(true), { timeout: 3000 })
      return () => w.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(() => setMounted(true), 1500)
    return () => window.clearTimeout(id)
  }, [isOpen])

  return mounted ? <CommandPalette /> : null
}
