import { describe, expect, it } from 'vitest'
import { MAX_REPORTS_PER_REQUEST, parseCspReports, stripUrl } from './cspReport'

describe('parseCspReports', () => {
  it('reads the report-uri shape', () => {
    const body = {
      'csp-report': {
        'document-uri': 'https://www.jackdeng.cc/en/blog/post?utm_source=x#top',
        'effective-directive': 'script-src-elem',
        'violated-directive': 'script-src-elem',
        'blocked-uri': 'https://evil.example/x.js?token=abc',
        'source-file': 'https://www.jackdeng.cc/_next/static/chunks/a.js',
        'line-number': 12,
        disposition: 'report',
      },
    }
    expect(parseCspReports(body)).toEqual([{
      directive: 'script-src-elem',
      blocked: 'https://evil.example/x.js',
      page: 'https://www.jackdeng.cc/en/blog/post',
      source: 'https://www.jackdeng.cc/_next/static/chunks/a.js',
      line: 12,
      disposition: 'report',
    }])
  })

  it('reads the Reporting API shape and skips other report types', () => {
    const body = [
      { type: 'deprecation', body: { id: 'x' } },
      {
        type: 'csp-violation',
        body: {
          documentURL: 'https://www.jackdeng.cc/zh',
          effectiveDirective: 'img-src',
          blockedURL: 'https://cdn.example/a.png',
          disposition: 'report',
        },
      },
    ]
    expect(parseCspReports(body)).toEqual([{
      directive: 'img-src',
      blocked: 'https://cdn.example/a.png',
      page: 'https://www.jackdeng.cc/zh',
      disposition: 'report',
    }])
  })

  it('falls back to violated-directive and keeps only its name', () => {
    const [v] = parseCspReports({
      'csp-report': {
        'document-uri': 'https://www.jackdeng.cc/en',
        'violated-directive': "style-src 'self'",
        'blocked-uri': 'inline',
      },
    })
    expect(v.directive).toBe('style-src')
    expect(v.blocked).toBe('inline')
  })

  it('calls an empty blocked-uri inline', () => {
    const [v] = parseCspReports({
      'csp-report': { 'document-uri': 'https://www.jackdeng.cc/en', 'effective-directive': 'script-src-elem', 'blocked-uri': '' },
    })
    expect(v.blocked).toBe('inline')
  })

  it('ignores non-CSP reports even when the body looks like one', () => {
    const body = { documentURL: 'https://www.jackdeng.cc/en', effectiveDirective: 'img-src', blockedURL: 'https://x.example/a.png' }
    expect(parseCspReports([{ type: 'permissions-policy-violation', body }])).toEqual([])
  })

  it('drops reports missing the directive or the page', () => {
    expect(parseCspReports({ 'csp-report': { 'effective-directive': 'img-src', 'blocked-uri': 'https://x.example' } })).toEqual([])
    expect(parseCspReports({ 'csp-report': { 'document-uri': 'https://www.jackdeng.cc/en' } })).toEqual([])
  })

  it('returns nothing for bodies that are not reports', () => {
    for (const body of [null, 'text', 42, {}, { 'csp-report': 'x' }, [1, 'a', null], [{ type: 'csp-violation' }]]) {
      expect(parseCspReports(body)).toEqual([])
    }
  })

  it('caps how many reports one request can log', () => {
    const one = { type: 'csp-violation', body: { documentURL: 'https://www.jackdeng.cc/en', effectiveDirective: 'img-src', blockedURL: 'https://x.example/a.png' } }
    expect(parseCspReports(Array(MAX_REPORTS_PER_REQUEST + 30).fill(one))).toHaveLength(MAX_REPORTS_PER_REQUEST)
  })
})

describe('stripUrl', () => {
  it('drops the query and fragment', () => {
    expect(stripUrl('https://a.example/p/q?x=1#y')).toBe('https://a.example/p/q')
  })
  it('reduces data: and blob: URLs to their scheme', () => {
    expect(stripUrl('data:image/png;base64,AAAA')).toBe('data')
    expect(stripUrl('blob:https://a.example/uuid')).toBe('blob')
  })
  it('passes keywords through, truncated', () => {
    expect(stripUrl('eval')).toBe('eval')
    expect(stripUrl('x'.repeat(500))).toHaveLength(100)
  })
})
