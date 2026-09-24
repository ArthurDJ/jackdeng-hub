'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useCommandPalette } from '@/hooks/useCommandPalette'

// The palette itself (search, results, keyboard navigation) is downloaded the
// first time someone opens it, not with every page. Most visits never do, and
// it used to ride in the bundle every page waits on before it is interactive.
// This host is all that ships up front: the ⌘K / Ctrl+K shortcut and the
// store subscription that tells it when to load.
const CommandPalette = dynamic(
  () => import('./CommandPalette').then((m) => m.CommandPalette),
  { ssr: false },
)

export function CommandPaletteHost() {
  const { isOpen } = useCommandPalette()
  const [wanted, setWanted] = useState(false)

  useEffect(() => {
    if (isOpen) setWanted(true)
  }, [isOpen])

  // Once loaded it stays mounted, so reopening is instant.
  return wanted ? <CommandPalette /> : null
}
