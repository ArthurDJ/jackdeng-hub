import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

/**
 * next-intl middleware — handles locale prefix routing for frontend pages.
 *
 * /admin, /api, /_next, and static files are intentionally excluded so
 * Payload CMS can handle them directly without locale interference.
 * This also means Payload's admin authentication redirects work correctly.
 */
export default createMiddleware(routing)

export const config = {
  matcher: [
    // Match all paths EXCEPT:
    //   /admin(/*) — Payload CMS admin, handles its own auth redirects
    //   /api(/*) — Next.js API routes and Payload REST API
    //   /_next — Next.js internals
    //   /_vercel — Vercel internals
    //   /.*\..* — static files (images, fonts, favicons, etc.)
    '/((?!admin|api|_next|_vercel|.*\\..*).*)',
  ],
}
