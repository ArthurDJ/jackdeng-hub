import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Match all paths except Payload admin, API routes, and static files
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|admin).*)',
  ],
}
