'use client'

import { useState } from 'react'

/**
 * The home page intro with a Short / Long switch, after leerob.com's bio
 * toggle: a recruiter gets the two-sentence version first, and one click
 * opens the longer one. Both texts are server-rendered into the page (the
 * inactive one `hidden`), so the long bio is readable without JavaScript
 * and by crawlers. Print shows whichever is selected, the short one unless
 * the reader chose otherwise.
 */
export function IntroSwitch({ short, long, labels }: {
  short: string
  long: string[]
  labels: { group: string; short: string; long: string }
}) {
  const [mode, setMode] = useState<'short' | 'long'>('short')
  const text: React.CSSProperties = { fontSize: 16, fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 560 }

  return (
    <div className="mb-8">
      <div role="group" aria-label={labels.group} className="ds-seg-group inline-flex mb-4 print:hidden!">
        {(['short', 'long'] as const).map((m) => (
          <button key={m} type="button" className="ds-seg" aria-pressed={mode === m} onClick={() => setMode(m)}>
            {labels[m]}
          </button>
        ))}
      </div>
      <p className="ds-fade" hidden={mode !== 'short'} style={text}>{short}</p>
      <div className="ds-fade" hidden={mode !== 'long'} style={{ display: mode === 'long' ? 'flex' : undefined, flexDirection: 'column', gap: 12 }}>
        {long.map((p) => <p key={p} style={text}>{p}</p>)}
      </div>
    </div>
  )
}
