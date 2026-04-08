// Root-level 404 fallback — no i18n (locale prefix not available here).
// Locale-scoped 404s are handled by src/app/[locale]/not-found.tsx.
export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#0a0a0a', color: '#ededed', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <div>
          <p style={{ fontSize: 72, fontWeight: 700, color: 'rgba(255,255,255,0.12)', lineHeight: 1, marginBottom: 24 }}>404</p>
          <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 12 }}>Page not found</h1>
          <a href="/en" style={{ fontSize: 14, color: '#3b82f6', textDecoration: 'none' }}>← Go back home</a>
        </div>
      </body>
    </html>
  )
}
