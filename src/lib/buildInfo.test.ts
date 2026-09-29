import { describe, expect, it } from 'vitest'
import { buildInfo } from './buildInfo'

describe('buildInfo', () => {
  it('shortens the commit and links the full one', () => {
    const sha = '1b133fc0123456789abcdef0123456789abcdef0'
    expect(buildInfo({ BUILD_TIME: '2026-09-29T18:59:23.000Z', BUILD_COMMIT: sha })).toEqual({
      time: '2026-09-29T18:59:23.000Z',
      commit: '1b133fc',
      commitUrl: `https://github.com/ArthurDJ/jackdeng-hub/commit/${sha}`,
    })
  })

  it('reports nothing it cannot vouch for', () => {
    expect(buildInfo({})).toEqual({ time: null, commit: null, commitUrl: null })
    expect(buildInfo({ BUILD_TIME: 'soon', BUILD_COMMIT: 'main' })).toEqual({ time: null, commit: null, commitUrl: null })
  })

  it('shows the date alone for a local build', () => {
    expect(buildInfo({ BUILD_TIME: '2026-09-29T18:59:23.000Z', BUILD_COMMIT: '' }).commit).toBeNull()
  })
})
