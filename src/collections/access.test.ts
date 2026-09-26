import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Access, CollectionConfig, PayloadRequest, Where } from 'payload'
import { Blogs } from './Blogs'
import { Categories } from './Categories'
import { Comments } from './Comments'
import { Media } from './Media'
import { Projects } from './Projects'
import { Tags } from './Tags'
import { ToolRuns } from './ToolRuns'
import { Tools } from './Tools'
import { Users } from './Users'

/**
 * Everything an anonymous caller may do through Payload's REST API.
 *
 * Payload serves every collection at /api/<slug> whether or not any page uses
 * the route, so `access` is all that stands between a visitor and the table.
 * Two rules were wider than anything the site needed (#74): `comments`
 * answered with approved comments whole, email and IP included, and
 * `tool-runs` accepted anonymous writes. Neither showed up anywhere, because
 * the pages go through the Local API.
 *
 * `true` means allowed outright; a Where is the filter Payload applies to an
 * anonymous read. Every operation not listed here must be denied.
 */
const PUBLIC: Record<string, Record<string, true | Where>> = {
  blogs: { read: { status: { equals: 'published' } } },
  categories: { read: true },
  tags: { read: true },
  tools: {
    read: { and: [{ status: { equals: 'online' } }, { accessControl: { equals: 'public' } }] },
  },
}

/** Fields an anonymous caller must not read even if their collection becomes readable. */
const PRIVATE_FIELDS: Record<string, string[]> = {
  comments: ['authorEmail', 'ip'],
}

const collections: Record<string, CollectionConfig> = {
  Blogs, Categories, Comments, Media, Projects, Tags, ToolRuns, Tools, Users,
}

// What Payload uses for an operation a collection leaves out
// (payload/dist/auth/defaultAccess.js). It is not exported, so it is restated.
const defaultAccess: Access = ({ req }) => Boolean(req.user)

const anonymous = { req: { user: null } as unknown as PayloadRequest }
const signedIn = { req: { user: { id: 1, collection: 'users' } } as unknown as PayloadRequest }

describe('collection access for an anonymous caller', () => {
  it('covers every collection in src/collections', () => {
    const dir = path.dirname(fileURLToPath(import.meta.url))
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
      .map((f) => f.slice(0, -'.ts'.length))
    expect(Object.keys(collections).sort()).toEqual(files.sort())
  })

  for (const collection of Object.values(collections)) {
    const rules = (collection.access ?? {}) as Record<string, Access | undefined>
    // The four, plus anything else the collection sets: `readVersions: () => true`
    // would open a route just the same.
    const operations = new Set(['create', 'read', 'update', 'delete', ...Object.keys(rules)])

    for (const operation of operations) {
      const expected = PUBLIC[collection.slug]?.[operation] ?? false
      const outcome = expected === false ? 'denied' : expected === true ? 'allowed' : 'filtered'

      it(`${collection.slug}: ${operation} is ${outcome}`, async () => {
        const access = rules[operation] ?? defaultAccess
        expect(await access(anonymous)).toEqual(expected)
      })
    }
  }

  for (const [slug, names] of Object.entries(PRIVATE_FIELDS)) {
    for (const name of names) {
      it(`${slug}.${name} is readable only when signed in`, async () => {
        const collection = Object.values(collections).find((c) => c.slug === slug)
        const field = collection?.fields.find((f) => 'name' in f && f.name === name)
        expect(field, `${slug}.${name} not found`).toBeDefined()

        const read = field && 'access' in field ? field.access?.read : undefined
        expect(read, `${slug}.${name} has no field-level read access`).toBeTypeOf('function')
        expect(await read!(anonymous)).toBe(false)
        expect(await read!(signedIn)).toBe(true)
      })
    }
  }
})
