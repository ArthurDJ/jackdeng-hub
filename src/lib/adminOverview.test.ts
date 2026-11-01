import { afterEach, describe, expect, it, vi } from 'vitest'
import { adminCreateUrl, adminEditUrl, adminLanguage, adminListUrl, orNull } from './adminOverview'

describe('adminLanguage', () => {
  it('is English only when the admin says so', () => {
    expect(adminLanguage('en')).toBe('en')
    expect(adminLanguage('EN')).toBe('en')
    expect(adminLanguage('en-US')).toBe('en')
  })

  it('falls back to Chinese, like the admin', () => {
    expect(adminLanguage('zh')).toBe('zh')
    expect(adminLanguage(undefined)).toBe('zh')
    expect(adminLanguage(null)).toBe('zh')
    expect(adminLanguage('')).toBe('zh')
    expect(adminLanguage('fr')).toBe('zh')
    expect(adminLanguage('eng')).toBe('zh')
  })
})

describe('admin URLs', () => {
  it('builds the filtered list URL the list view reads', () => {
    expect(adminListUrl('/admin', 'blogs', { status: 'draft' })).toBe('/admin/collections/blogs?where[status][equals]=draft')
    expect(adminListUrl('/admin', 'comments', { status: 'pending' })).toBe(
      '/admin/collections/comments?where[status][equals]=pending',
    )
  })

  it('leaves the query off when there is no filter', () => {
    expect(adminListUrl('/admin', 'projects')).toBe('/admin/collections/projects')
    expect(adminListUrl('/admin', 'projects', {})).toBe('/admin/collections/projects')
  })

  it('joins several filters and encodes their values', () => {
    expect(adminListUrl('/admin', 'tools', { status: 'online', accessControl: 'a&b' })).toBe(
      '/admin/collections/tools?where[status][equals]=online&where[accessControl][equals]=a%26b',
    )
  })

  it('copes with a trailing slash on the admin route', () => {
    expect(adminListUrl('/admin/', 'blogs')).toBe('/admin/collections/blogs')
    expect(adminCreateUrl('/cms/', 'media')).toBe('/cms/collections/media/create')
  })

  it('points at the create and edit views', () => {
    expect(adminCreateUrl('/admin', 'blogs')).toBe('/admin/collections/blogs/create')
    expect(adminEditUrl('/admin', 'blogs', 42)).toBe('/admin/collections/blogs/42')
    expect(adminEditUrl('/admin', 'blogs', 'a/b')).toBe('/admin/collections/blogs/a%2Fb')
  })
})

describe('orNull', () => {
  afterEach(() => vi.restoreAllMocks())

  it('passes a result through', async () => {
    await expect(orNull(Promise.resolve({ totalDocs: 3 }), 'count')).resolves.toEqual({ totalDocs: 3 })
  })

  it('turns a failure into null and logs it with its context', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('connection refused')
    await expect(orNull(Promise.reject(err), 'blogs drafts')).resolves.toBeNull()
    expect(log).toHaveBeenCalledOnce()
    expect(log.mock.calls[0][0]).toContain('blogs drafts')
    expect(log.mock.calls[0][1]).toBe(err)
  })
})
