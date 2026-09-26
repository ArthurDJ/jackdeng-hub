import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Match every path that should be locale-prefixed, i.e. everything except:
  // - `api`    — Payload REST, comment submission, tool callbacks
  // - `admin`  — Payload admin UI
  // - `_next` / `_vercel` — framework internals
  // - `og`     — dynamic OpenGraph image route (src/app/og/route.tsx)
  // - anything containing a dot — root-level metadata routes (`robots.txt`,
  //   `sitemap.xml`, `feed.xml`, `favicon.ico`) and static files under
  //   /public (`resume.pdf`, `/media/*.webp`, …)
  //
  // Root-level routes MUST stay out of this matcher: next-intl would 307 them
  // to `/en/<path>`, where no route exists, so crawlers and social scrapers
  // get a redirect into a 404 instead of the file.
  matcher: [
    '/((?!api|admin|_next|_vercel|og|.*\\..*).*)',
  ],
}
