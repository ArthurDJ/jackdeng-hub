'use client'

/**
 * Minimal Zustand-free store using React's useSyncExternalStore pattern.
 * Keeps the Command Palette state globally accessible without adding
 * a heavy state management dependency.
 */

type Listener = () => void

let isOpen = false
const listeners = new Set<Listener>()

// Whatever had focus before the palette opened (the search button, or the
// page under ⌘K), so closing hands it back instead of dropping focus on
// <body> and sending a keyboard user back to the top of the page.
let returnFocus: HTMLElement | null = null

function notify() {
  listeners.forEach((l) => l())
}

function rememberFocus() {
  const el = typeof document !== 'undefined' ? document.activeElement : null
  returnFocus = el instanceof HTMLElement && el !== document.body ? el : null
}

function restoreFocus() {
  const el = returnFocus
  returnFocus = null
  if (el && el.isConnected) el.focus()
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
    if (!isOpen) { rememberFocus(); isOpen = true; notify() }
  },
  close() {
    if (isOpen) { isOpen = false; notify(); restoreFocus() }
  },
  toggle() {
    if (isOpen) commandPaletteStore.close()
    else commandPaletteStore.open()
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
