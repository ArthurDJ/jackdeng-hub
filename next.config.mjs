import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// The policy. Enforced on the site; /admin gets it report-only (below).
// Violations are posted to /api/csp-report, which logs them
// (src/app/api/csp-report), with `disposition` saying which of the two.
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
const DEV = process.env.NODE_ENV === 'development'
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${DEV ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src 'self' https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  'report-uri /api/csp-report',
].join('; ')

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

// The site ran the policy report-only from #58; a scan of every page type,
// the six Playground tools, search, the theme switch and the comment form
// found no violations, so it is enforced there. Payload's admin loads its
// own editor code and was never checked against it, so /admin keeps
// enforcing frame-ancestors alone and trials the rest.
const SITE_HEADERS = [{ key: 'Content-Security-Policy', value: CSP }, ...COMMON_HEADERS]
const ADMIN_HEADERS = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
  { key: 'Content-Security-Policy-Report-Only', value: CSP },
  ...COMMON_HEADERS,
]

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
  allowedDevOrigins: ['playing-sydney-fingers-wireless.trycloudflare.com'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
}

export default withPayload(withNextIntl(nextConfig))
