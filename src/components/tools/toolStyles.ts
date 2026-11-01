import type { CSSProperties } from 'react'

/**
 * The styles every Playground tool card shares. Each tool used to define
 * its own copies; changing the card look meant editing four files in step.
 */

/** A raised card, the basic container of a tool's UI. */
export const panel: CSSProperties = {
  background: 'var(--bg-panel)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 20,
}

/** Numbers, code and timestamps. */
export const mono: CSSProperties = { fontFamily: 'var(--font-geist-mono, ui-monospace, monospace)' }

/** The small upper-case caption over a value or a section. */
export const label: CSSProperties = {
  fontSize: 11, fontWeight: 510, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)',
}
