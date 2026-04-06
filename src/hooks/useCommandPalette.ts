'use client'

import { useEffect, useCallback } from 'react'
import { useCommandPaletteStore } from '@/store/commandPaletteStore'

/**
 * Mount this hook once in the root layout (via a client component wrapper).
 * It registers the global Cmd/Ctrl+K shortcut and the Escape close binding.
 */
export function useCommandPalette() {
  const { isOpen, open, close, toggle } = useCommandPaletteStore()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Win/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
        return
      }
      // Escape closes
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        close()
      }
    },
    [isOpen, toggle, close],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { isOpen, open, close }
}
