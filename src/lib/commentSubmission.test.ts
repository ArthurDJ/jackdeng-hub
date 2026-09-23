import { describe, expect, it } from 'vitest'
import { parseCommentSubmission } from './commentSubmission'

const valid = {
  authorName: 'Ada',
  authorEmail: 'ada@example.com',
  content: 'Nice post.',
  post: 1,
}

describe('parseCommentSubmission', () => {
  it('accepts a well-formed body and trims it', () => {
    const result = parseCommentSubmission({ ...valid, authorName: '  Ada  ', content: ' Hi there ' })
    expect(result).toEqual({
      status: 'ok',
      value: {
        authorName: 'Ada',
        authorEmail: 'ada@example.com',
        content: 'Hi there',
        post: 1,
        honeypot: '',
      },
    })
  })

  it('rejects a body that is not an object', () => {
    // `await request.json()` returns whatever was sent, including null when the
    // body is absent or malformed.
    expect(parseCommentSubmission(null).status).toBe('rejected')
    expect(parseCommentSubmission('nope').status).toBe('rejected')
    expect(parseCommentSubmission(undefined).status).toBe('rejected')
  })

  it('mirrors the collection name limits', () => {
    expect(parseCommentSubmission({ ...valid, authorName: '' })).toEqual({
      status: 'rejected',
      reason: 'invalid_name',
    })
    expect(parseCommentSubmission({ ...valid, authorName: '   ' })).toEqual({
      status: 'rejected',
      reason: 'invalid_name',
    })
    expect(parseCommentSubmission({ ...valid, authorName: 'a'.repeat(60) }).status).toBe('ok')
    expect(parseCommentSubmission({ ...valid, authorName: 'a'.repeat(61) })).toEqual({
      status: 'rejected',
      reason: 'invalid_name',
    })
  })

  it('mirrors the collection content limits', () => {
    expect(parseCommentSubmission({ ...valid, content: 'a' })).toEqual({
      status: 'rejected',
      reason: 'invalid_content',
    })
    expect(parseCommentSubmission({ ...valid, content: 'ab' }).status).toBe('ok')
    expect(parseCommentSubmission({ ...valid, content: 'a'.repeat(500) }).status).toBe('ok')
    expect(parseCommentSubmission({ ...valid, content: 'a'.repeat(501) })).toEqual({
      status: 'rejected',
      reason: 'invalid_content',
    })
  })

  it('rejects addresses that are obviously not addresses', () => {
    for (const authorEmail of ['', 'ada', 'ada@', '@example.com', 'ada@example', 'a b@c.com']) {
      expect(parseCommentSubmission({ ...valid, authorEmail })).toEqual({
        status: 'rejected',
        reason: 'invalid_email',
      })
    }
  })

  it('normalises the post id to the integer the column stores', () => {
    // `blog.id` is a number in Postgres and a string in the React prop, so
    // both shapes reach the route depending on who is calling.
    expect(parseCommentSubmission({ ...valid, post: 12 })).toMatchObject({
      status: 'ok',
      value: { post: 12 },
    })
    expect(parseCommentSubmission({ ...valid, post: '12' })).toMatchObject({
      status: 'ok',
      value: { post: 12 },
    })
  })

  it('rejects anything that is not a positive integer id', () => {
    for (const post of ['', '   ', 'abc', 0, -1, 1.5, '1.5', null, undefined, {}, []]) {
      expect(parseCommentSubmission({ ...valid, post })).toEqual({
        status: 'rejected',
        reason: 'invalid_post',
      })
    }
  })

  it('passes the honeypot through rather than judging it', () => {
    // The trap is enforced in the collection hook so that every write path is
    // covered, not just this one. The parser only has to carry it.
    expect(parseCommentSubmission({ ...valid, honeypot: 'filled in' })).toMatchObject({
      status: 'ok',
      value: { honeypot: 'filled in' },
    })
  })

  it('ignores fields the client is not allowed to set', () => {
    const result = parseCommentSubmission({ ...valid, status: 'approved', ip: '9.9.9.9', id: 7 })
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(Object.keys(result.value).sort()).toEqual([
        'authorEmail',
        'authorName',
        'content',
        'honeypot',
        'post',
      ])
    }
  })
})
