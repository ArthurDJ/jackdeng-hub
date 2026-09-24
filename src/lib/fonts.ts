import localFont from 'next/font/local'

// Geist Mono, declared here rather than imported from 'geist/font/mono' for
// one option: preload. The package preloads it, so every page fetched 71 KB
// of monospace font alongside the main font and scripts, competing with them
// at the start of the load, for text that is only ever dates, reading times
// and small labels. Unpreloaded, the browser fetches it when that text is
// laid out, and it swaps in like any other webfont. Every other setting
// matches the package's own declaration.
export const GeistMono = localFont({
  src: '../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  preload: false,
  adjustFontFallback: false,
  fallback: [
    'ui-monospace',
    'SFMono-Regular',
    'Roboto Mono',
    'Menlo',
    'Monaco',
    'Liberation Mono',
    'DejaVu Sans Mono',
    'Courier New',
    'monospace',
  ],
})
