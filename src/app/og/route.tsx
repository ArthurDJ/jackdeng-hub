import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  // Capped: this renders whatever the query says onto an image served from
  // this domain, so it should not take an essay.
  const title = (searchParams.get('title') ?? 'Jack Deng').slice(0, 120)
  // Optional line under the title — the home page and /about put the headline
  // here, so a shared link says what the person does, not just their name.
  const subtitle = searchParams.get('subtitle')?.slice(0, 120) ?? null
  const type = searchParams.get('type') ?? 'default' // 'blog' | 'default'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#0a0a0a',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top accent line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '3px', backgroundColor: '#3b82f6', borderRadius: '2px' }} />
          <span style={{ color: '#3b82f6', fontSize: '14px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {type === 'blog' ? 'Blog' : 'jackdeng.cc'}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            gap: '20px',
            padding: '40px 0',
          }}
        >
          <h1
            style={{
              fontSize: title.length > 50 ? '52px' : '64px',
              fontWeight: 700,
              color: '#ededed',
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '32px', color: '#a1a1aa', margin: 0, lineHeight: 1.3 }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Bottom: author */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              J
            </div>
            <span style={{ color: '#a1a1aa', fontSize: '18px' }}>Jack Deng</span>
          </div>
          <span style={{ color: '#52525b', fontSize: '15px' }}>jackdeng.cc</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
