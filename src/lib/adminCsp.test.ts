import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

// The admin's CSP allows one Monaco version's path on jsDelivr
// (next.config.mjs). @monaco-editor/loader, which Payload's code fields use,
// decides which version it fetches; when an upgrade moves it, the admin's code
// editor would be blocked with nothing else failing. This fails first.
describe('admin CSP and Monaco', () => {
  it("allows the path @monaco-editor/loader actually loads from", async () => {
    const config = readFileSync('next.config.mjs', 'utf8')
    const allowed = config.match(/const MONACO_CDN = '([^']+)'/)?.[1]
    expect(allowed).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/npm\/monaco-editor@[\d.]+\/$/)

    const require = createRequire(import.meta.url)
    const loaderDir = require.resolve('@monaco-editor/loader', {
      paths: [require.resolve('@monaco-editor/react')],
    })
    const loaderConfig = readFileSync(loaderDir.replace(/lib\/.*$/, 'lib/es/config/index.js'), 'utf8')
    const vs = loaderConfig.match(/vs:\s*'([^']+)'/)?.[1]
    expect(vs, 'path the loader fetches Monaco from').toBeDefined()
    expect(vs!.startsWith(allowed!)).toBe(true)
  })
})
