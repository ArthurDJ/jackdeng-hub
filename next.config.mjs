import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// The policy, enforced on the site and on /admin (#162). Violations are
// posted to /api/csp-report, which logs them (src/app/api/csp-report).
//
// What each source is for:
//   challenges.cloudflare.com         Turnstile on the comment form: its
//                                     script, its iframe, its API calls
//   *.public.blob.vercel-storage.com  covers and media (Vercel Blob)
//   data: / blob:                     inline SVG icons, Payload admin previews
//
// 'unsafe-inline' stays in script-src: Next streams each page as inline
// <script> chunks, and the alternative, a per-request nonce, would make every
// cached page render on every request. What the policy still buys: no
// scripts from any other host, no plugins, no <base> hijack, forms that only
// post back here, and frames only from here and Turnstile.
//
// 'unsafe-eval' is added under `next dev` only: React uses eval() in
// development to rebuild server component stacks. Production never gets it.
//
// A tool embedded by URL (embedType iframe or script) is blocked until its
// origin is added to frame-src or script-src.
//
// /admin adds one source. Payload's code fields are Monaco, which
// @monaco-editor/loader fetches from jsDelivr (scripts, a stylesheet, its
// icon font, a worker), so the admin allows that one package version's path
// and nothing else on the CDN. src/lib/adminCsp.test.ts fails when a
// dependency upgrade moves Monaco to another version.
const DEV = process.env.NODE_ENV === 'development'
const MONACO_CDN = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/'
function policy({ admin }) {
  const monaco = admin ? ` ${MONACO_CDN}` : ''
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${DEV ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com${monaco}`,
    `style-src 'self' 'unsafe-inline'${monaco}`,
    "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
    `font-src 'self' data:${monaco}`,
    "connect-src 'self' https://challenges.cloudflare.com",
    "frame-src 'self' https://challenges.cloudflare.com",
    `worker-src 'self' blob:${monaco}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    'report-uri /api/csp-report',
  ].join('; ')
}
const CSP = policy({ admin: false })
const ADMIN_CSP = policy({ admin: true })

// Sent on every response. Until these, the only security header was the HSTS
// Vercel adds, so any site could frame /admin and clickjack a signed-in
// editor.
const COMMON_HEADERS = [
  // For browsers that predate frame-ancestors.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
]

// The site ran the policy report-only from #58 and enforces it since a scan
// found no violations. /admin ran it report-only until #162: logged in on a
// local build, the dashboard, list and edit views and a code block in the
// post editor reported two things, the Gravatar avatar (now Payload's own,
// payload.config.ts) and Monaco from jsDelivr (allowed above, admin only).
const SITE_HEADERS = [{ key: 'Content-Security-Policy', value: CSP }, ...COMMON_HEADERS]
const ADMIN_HEADERS = [{ key: 'Content-Security-Policy', value: ADMIN_CSP }, ...COMMON_HEADERS]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The footer's status line (src/lib/buildInfo.ts): when this build ran and
  // from which commit. Written into the build, so a page regenerated later
  // still shows the deploy. VERCEL_GIT_COMMIT_SHA is unset in a local build.
  env: {
    BUILD_TIME: new Date().toISOString(),
    BUILD_COMMIT: process.env.VERCEL_GIT_COMMIT_SHA ?? '',
  },
  async headers() {
    return [
      // Every path but /admin and /admin/…; the two rules never overlap.
      { source: '/:path((?!admin(?:/|$)).*)', headers: SITE_HEADERS },
      { source: '/admin/:path*', headers: ADMIN_HEADERS },
    ]
  },
  // Pagination moved from ?page=N to /page/N so the list pages can be cached
  // (reading searchParams forces a per-request render). Old links keep
  // working: page 2 and up go to the new URL; ?page=1 and junk values are
  // left alone and simply get page 1.
  async redirects() {
    const page = [{ type: 'query', key: 'page', value: '(?<page>[2-9]|[1-9]\\d+)' }]
    return [
      { source: '/:locale(en|zh)/blog', has: page, destination: '/:locale/blog/page/:page', permanent: true },
      { source: '/:locale(en|zh)/blog/category/:slug', has: page, destination: '/:locale/blog/category/:slug/page/:page', permanent: true },
      { source: '/:locale(en|zh)/blog/tag/:slug', has: page, destination: '/:locale/blog/tag/:slug/page/:page', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
}

const withPlugins = withPayload(withNextIntl(nextConfig))

/**
 * withPayload adds `Accept-CH` / `Critical-CH: Sec-CH-Prefers-Color-Scheme`
 * (and `Vary` on it) to every path, so the admin can match the system theme on
 * its first render. On the public site Critical-CH made Chrome throw away the
 * first response and fetch the page again with the hint, which Lighthouse
 * counted as a ~600 ms redirect before every page (#154); the site picks its
 * theme on the client and never reads the hint. Same rule, scoped to /admin.
 * If Payload ever changes the rule's shape this matches nothing and the header
 * stays as it was; smoke.py checks that it is gone from the site.
 */
async function headers() {
  const rules = withPlugins.headers ? await withPlugins.headers() : []
  return rules.map((rule) =>
    rule.source === '/:path*' && rule.headers.some((h) => h.key === 'Critical-CH')
      ? { ...rule, source: '/admin/:path*' }
      : rule,
  )
}

const config = { ...withPlugins, headers }

export default config
