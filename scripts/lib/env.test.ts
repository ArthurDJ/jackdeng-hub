import { afterEach, describe, expect, it, vi } from 'vitest'
import { describeTarget, requireApply } from './env'

describe('describeTarget', () => {
  it('treats only a local database as not production', () => {
    expect(describeTarget('postgresql://postgres:ci@localhost:5432/migrated')).toEqual({ host: 'localhost', isProduction: false })
    expect(describeTarget('postgres://postgres@127.0.0.1/check').isProduction).toBe(false)
  })

  it('treats Supabase as production', () => {
    expect(describeTarget('postgresql://u:p@aws-1-us-east-1.pooler.supabase.com:6543/postgres')).toEqual({
      host: 'aws-1-us-east-1.pooler.supabase.com',
      isProduction: true,
    })
  })

  // The cases that used to slip through as "not production".
  it('fails closed on any other host', () => {
    expect(describeTarget('postgresql://u:p@db.example.net:5432/postgres').isProduction).toBe(true)
    expect(describeTarget('postgresql://u:p@localhost/db?host=db.example.net').isProduction).toBe(true)
  })

  it('fails closed on a missing or unparseable URI, without echoing it', () => {
    expect(describeTarget(undefined)).toEqual({ host: '(DATABASE_URI not set)', isProduction: true })
    expect(describeTarget('not a url with a p4ssword')).toEqual({ host: '(unparseable DATABASE_URI)', isProduction: true })
  })
})

describe('requireApply', () => {
  const opts = { script: 'scripts/x.ts', writes: ['blogs'] }
  afterEach(() => vi.restoreAllMocks())

  it('exits without --apply against production', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit') }) as never)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => requireApply(opts, { host: 'db.example.net', isProduction: true }, ['node', 'x.ts'])).toThrow('exit')
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('proceeds with --apply, and on a local database without it', () => {
    const exit = vi.spyOn(process, 'exit')
    vi.spyOn(console, 'log').mockImplementation(() => {})
    requireApply(opts, { host: 'db.example.net', isProduction: true }, ['node', 'x.ts', '--apply'])
    requireApply(opts, { host: 'localhost', isProduction: false }, ['node', 'x.ts'])
    expect(exit).not.toHaveBeenCalled()
  })
})
