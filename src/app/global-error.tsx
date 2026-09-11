'use client'

/**
 * Last-resort boundary: catches errors thrown in the root layout itself, where
 * [locale]/error.tsx never gets a chance to render.
 *
 * It replaces the whole document, so it must ship its own <html> and <body> —
 * and it cannot use next-intl, the theme provider, or globals.css, because the
 * failure may well be in whatever provides them. Hence the literal hex values,
 * which mirror the dark-theme tokens, and English-only copy. Same reasoning as
 * src/app/not-found.tsx.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: '#0a0a0a',
          color: '#ededed',
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <div style={{ padding: 24 }}>
          <p
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.12)',
              lineHeight: 1,
              marginBottom: 24,
            }}
          >
            500
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 12 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 28 }}>
            This page hit an unexpected error.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '10px 24px',
              borderRadius: 9999,
              background: '#3b82f6',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ marginTop: 28, fontSize: 12, color: '#71717a' }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
