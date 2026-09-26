import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

const { revalidatePath, revalidateTag } = await import('next/cache')
const { revalidateAfterChange, revalidateAfterDelete, revalidateSite } = await import('./revalidate')

// The hooks only read these three arguments.
type ChangeArgs = Parameters<ReturnType<typeof revalidateAfterChange>>[0]
type DeleteArgs = Parameters<ReturnType<typeof revalidateAfterDelete>>[0]
const collection = { slug: 'blogs' }
const change = (doc: object, previousDoc?: object) =>
  ({ doc: { id: 1, ...doc }, previousDoc, collection }) as unknown as ChangeArgs
const del = (doc: object) => ({ doc: { id: 1, ...doc }, collection }) as unknown as DeleteArgs

const isPublished = (doc: Record<string, unknown>) => doc.status === 'published'

beforeEach(() => {
  vi.mocked(revalidatePath).mockReset()
  vi.mocked(revalidateTag).mockReset()
})

describe('revalidateSite', () => {
  it('expires every page and both data caches immediately', () => {
    revalidateSite('test')
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(revalidateTag).toHaveBeenCalledWith('sidebar', { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith('search', { expire: 0 })
  })

  it('does not throw outside a Next.js request', () => {
    // What next/cache throws when a tsx script saves a document.
    vi.mocked(revalidatePath).mockImplementation(() => {
      throw new Error('Invariant: static generation store missing in revalidatePath /')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => revalidateSite('test')).not.toThrow()
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})

describe('revalidateAfterChange', () => {
  it('revalidates on every save when there is no visibility rule', () => {
    revalidateAfterChange()(change({}))
    expect(revalidatePath).toHaveBeenCalledOnce()
  })

  it('revalidates when a post is published, edited while published, or unpublished', () => {
    const hook = revalidateAfterChange(isPublished)
    hook(change({ status: 'published' }, { status: 'draft' }))
    hook(change({ status: 'published' }, { status: 'published' }))
    hook(change({ status: 'draft' }, { status: 'published' }))
    expect(revalidatePath).toHaveBeenCalledTimes(3)
  })

  it('leaves the caches alone for a draft that was never public', () => {
    const hook = revalidateAfterChange(isPublished)
    hook(change({ status: 'draft' }, { status: 'draft' }))
    hook(change({ status: 'draft' }))
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns the document unchanged', () => {
    const args = change({ status: 'draft' })
    expect(revalidateAfterChange(isPublished)(args)).toBe(args.doc)
  })
})

describe('revalidateAfterDelete', () => {
  it('revalidates when the deleted document was public', () => {
    revalidateAfterDelete(isPublished)(del({ status: 'published' }))
    expect(revalidatePath).toHaveBeenCalledOnce()
  })

  it('leaves the caches alone when it was not', () => {
    revalidateAfterDelete(isPublished)(del({ status: 'draft' }))
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
