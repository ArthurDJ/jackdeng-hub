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
 *
 * `variant="blog"` copies the blog list instead: the header band, BlogCard's
 * 16:9 cover, meta row, title and excerpt, and the sidebar from lg up.
 */
export function PageSkeleton({
  cards = 6,
  withNavbar = true,
  variant = 'cards',
}: {
  cards?: number
  withNavbar?: boolean
  variant?: 'cards' | 'blog'
}) {
  if (variant === 'blog') return <BlogListSkeleton cards={cards} />

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

const card = {
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--bg-panel)',
  border: '1px solid var(--border-default)',
  borderRadius: 12,
  overflow: 'hidden',
} as const

/** Same boxes as blog/(list)/view.tsx and BlogCard, so nothing moves on arrival. */
function BlogListSkeleton({ cards }: { cards: number }) {
  return (
    <main id="main" aria-busy="true" aria-live="polite">
      <section className="border-b border-subtle ds-section-padding">
        <div className="ds-container">
          <div className="ds-skeleton" style={{ height: 40, width: 'min(200px, 50%)', marginBottom: 12 }} />
          <div className="ds-skeleton" style={{ height: 18, width: 'min(360px, 80%)' }} />
        </div>
      </section>

      <div className="ds-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: cards }).map((_, i) => (
              <div key={i} style={card}>
                <div className="ds-skeleton" style={{ aspectRatio: '16/9', borderRadius: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 18px', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="ds-skeleton" style={{ height: 20, width: 64, borderRadius: 9999 }} />
                    <div className="ds-skeleton" style={{ height: 12, width: 72, marginLeft: 'auto' }} />
                  </div>
                  <div className="ds-skeleton" style={{ height: 15, width: '85%' }} />
                  <div className="ds-skeleton" style={{ height: 15, width: '55%', marginBottom: 4 }} />
                  <div className="ds-skeleton" style={{ height: 12, width: '100%' }} />
                  <div className="ds-skeleton" style={{ height: 12, width: '92%' }} />
                  <div className="ds-skeleton" style={{ height: 12, width: '64%' }} />
                  <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                    <div className="ds-skeleton" style={{ height: 20, width: 96, borderRadius: 9999 }} />
                    <div className="ds-skeleton" style={{ height: 20, width: 56, borderRadius: 9999 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:flex" style={{ flexDirection: 'column', gap: 32 }}>
            {[5, 4].map((rows, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="ds-skeleton" style={{ height: 12, width: 80, marginBottom: 4 }} />
                {Array.from({ length: rows }).map((_, j) => (
                  <div key={j} className="ds-skeleton" style={{ height: 13, width: `${90 - j * 9}%` }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
