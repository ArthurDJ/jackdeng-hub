import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// The full policy, sent report-only: browsers enforce none of it, and post
// every violation to /api/csp-report, which logs it (src/app/api/csp-report).
// Once the logs show only noise, it moves into Content-Security-Policy.
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
// A tool embedded by URL (embedType iframe or script) will show up here
// as a violation; add its origin when one exists.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
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

// Sent on every response, /admin included. Until these, the only security
// header was the HSTS Vercel adds, so any site could frame /admin and
// clickjack a signed-in editor.
//
// The enforced CSP carries frame-ancestors only; the rest of the policy is
// on trial as Content-Security-Policy-Report-Only, above.
const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
  { key: 'Content-Security-Policy-Report-Only', value: CSP_REPORT_ONLY },
  // For browsers that predate frame-ancestors.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
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
