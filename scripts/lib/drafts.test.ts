import { describe, expect, it } from 'vitest'
import { splitDraft } from './drafts'

describe('splitDraft', () => {
  it('takes the first paragraph as the short description', () => {
    const d = splitDraft('One line\nstill the first.\n\n## Section\n\n- item\n')
    expect(d.short).toBe('One line\nstill the first.')
    expect(d.body).toBe('## Section\n\n- item')
  })

  it('handles Windows line endings', () => {
    expect(splitDraft('Short.\r\n\r\nLong.\r\n')).toEqual({ short: 'Short.', body: 'Long.' })
  })

  it('refuses a draft with no body', () => {
    expect(() => splitDraft('Only a short description.\n', 'x.md')).toThrow('x.md: needs a first paragraph and a body')
  })
})
