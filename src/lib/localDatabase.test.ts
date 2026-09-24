import { describe, expect, it } from 'vitest'
import { isLocalDatabaseUrl } from './localDatabase'

describe('isLocalDatabaseUrl', () => {
  it('accepts a database on localhost or 127.0.0.1', () => {
    expect(isLocalDatabaseUrl('postgresql://postgres:pw@localhost:5432/migrated')).toBe(true)
    expect(isLocalDatabaseUrl('postgres://postgres@127.0.0.1/check')).toBe(true)
  })

  it('refuses the production host', () => {
    expect(isLocalDatabaseUrl('postgresql://u:p@aws-1-us-east-1.pooler.supabase.com:6543/postgres')).toBe(false)
  })

  it('refuses hosts that only look local', () => {
    expect(isLocalDatabaseUrl('postgresql://u:p@localhost.evil.com/db')).toBe(false)
    expect(isLocalDatabaseUrl('postgresql://u:p@evil.com/db?host=localhost')).toBe(false)
    expect(isLocalDatabaseUrl('postgresql://a@localhost:1@evil.com/db')).toBe(false)
    expect(isLocalDatabaseUrl('postgresql://u:p@evil.com/localhost')).toBe(false)
  })

  it('refuses nothing at all', () => {
    expect(isLocalDatabaseUrl(undefined)).toBe(false)
    expect(isLocalDatabaseUrl('')).toBe(false)
  })
})
