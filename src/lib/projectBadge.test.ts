import { describe, expect, it } from 'vitest'
import { projectBadge } from './projectBadge'

const labels = { since: (y: string) => `${y}–present`, completed: 'Completed', onHold: 'On Hold', active: 'Active' }

describe('projectBadge', () => {
  it('shows when an active project started, in a neutral colour', () => {
    const b = projectBadge({ status: 'active', year: '2026–' }, labels)
    expect(b?.label).toBe('2026–present')
    expect(b?.colors.text).toBe('var(--text-secondary)')
  })

  it('shows a closed range as written', () => {
    expect(projectBadge({ status: 'active', year: '2022–2023' }, labels)?.label).toBe('2022–2023')
  })

  it('keeps the status for finished and paused projects', () => {
    expect(projectBadge({ status: 'completed', year: '2024–' }, labels)?.label).toBe('Completed')
    expect(projectBadge({ status: 'on-hold', year: '2024–' }, labels)?.label).toBe('On Hold')
  })

  it('falls back to the status without a year, and to nothing without either', () => {
    expect(projectBadge({ status: 'active', year: null }, labels)?.label).toBe('Active')
    expect(projectBadge({}, labels)).toBeNull()
  })
})
