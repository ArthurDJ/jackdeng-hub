'use client'

/**
 * Minimal Zustand-free store using React's useSyncExternalStore pattern.
 * Keeps the Command Palette state globally accessible without adding
 * a heavy state management dependency.
 */

type Listener = () => void

let isOpen = false
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((l) => l())
}

export const commandPaletteStore = {
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot() {
    return isOpen
  },
  open() {
    if (!isOpen) { isOpen = true; notify() }
  },
  close() {
    if (isOpen) { isOpen = false; notify() }
  },
  toggle() {
    isOpen = !isOpen
    notify()
  },
}

// ── React binding ─────────────────────────────────────────────────────────────

import { useSyncExternalStore } from 'react'

export function useCommandPaletteStore() {
  const open_ = useSyncExternalStore(
    commandPaletteStore.subscribe,
    commandPaletteStore.getSnapshot,
    () => false, // server snapshot — always closed
  )
  return {
    isOpen: open_,
    open: commandPaletteStore.open,
    close: commandPaletteStore.close,
    toggle: commandPaletteStore.toggle,
  }
}
