import { describe, expect, it } from 'vitest'
import { appendSetCookie, clearEditorHintCookie, editorHintCookie, hasEditorHint } from './editorHint'

describe('editorHintCookie', () => {
  it('lasts as long as it is told, in whole seconds', () => {
    expect(editorHintCookie(2592000.7)).toBe('jd-editor=1; Path=/; Max-Age=2592000; SameSite=Lax; Secure')
  })

  it('never has a negative lifetime', () => {
    expect(editorHintCookie(-5)).toContain('Max-Age=0')
  })

  it('is cleared with an empty value that expires at once', () => {
    expect(clearEditorHintCookie()).toBe('jd-editor=; Path=/; Max-Age=0; SameSite=Lax; Secure')
  })
})

describe('hasEditorHint', () => {
  it('finds the hint among other cookies', () => {
    expect(hasEditorHint('theme=dark; jd-editor=1; NEXT_LOCALE=zh')).toBe(true)
    expect(hasEditorHint('jd-editor=1')).toBe(true)
  })

  it('ignores a cleared hint and look-alikes', () => {
    expect(hasEditorHint('')).toBe(false)
    expect(hasEditorHint('jd-editor=')).toBe(false)
    expect(hasEditorHint('jd-editor=10')).toBe(false)
    expect(hasEditorHint('not-jd-editor=1')).toBe(false)
  })
})

describe('appendSetCookie', () => {
  it('keeps every cookie queued on the request', () => {
    const req: { responseHeaders?: Headers } = {}
    appendSetCookie(req, 'a=1')
    appendSetCookie(req, 'b=2')
    expect(req.responseHeaders!.getSetCookie()).toEqual(['a=1', 'b=2'])
  })
})
