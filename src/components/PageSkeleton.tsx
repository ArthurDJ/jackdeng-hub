import { Navbar } from '@/components/Navbar'

/**
 * Placeholder shown while a DB-backed route segment streams in.
 *
 * Renders the Navbar so the page chrome stays put — swapping it out and back
 * makes navigation feel like a full reload. The blocks mirror the real
 * heading + card grid so the layout does not jump when content arrives.
 *
 * `withNavbar={false}` for segments whose own layout already renders one
 * (blog/layout.tsx does); otherwise the skeleton stacks a second Navbar.
 */
export function PageSkeleton({
  cards = 6,
  withNavbar = true,
}: {
  cards?: number
  withNavbar?: boolean
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {withNavbar && <Navbar />}

      <main id="main"
        className="ds-container"
        style={{ paddingTop: 64, paddingBottom: 80 }}
        aria-busy="true"
        aria-live="polite"
      >
        <div style={{ marginBottom: 48 }}>
          <div className="ds-skeleton" style={{ height: 40, width: 'min(280px, 60%)', marginBottom: 14 }} />
          <div className="ds-skeleton" style={{ height: 18, width: 'min(420px, 85%)' }} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-default)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div className="ds-skeleton" style={{ height: 20, width: '70%', marginBottom: 14 }} />
              <div className="ds-skeleton" style={{ height: 13, width: '100%', marginBottom: 8 }} />
              <div className="ds-skeleton" style={{ height: 13, width: '82%' }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
