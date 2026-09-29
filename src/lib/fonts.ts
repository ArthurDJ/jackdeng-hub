import localFont from 'next/font/local'

// Both Geist fonts are declared here, from the subset copies in src/fonts
// rather than the geist package's own files: those carry Greek, Cyrillic and
// extended Latin this site never shows, and at about 70 KB each they were the
// two largest downloads on every page after the scripts. The subsets keep
// the weight axis and the code points in src/fonts/subset.txt, and weigh
// about half (scripts/subset-fonts.sh rebuilds them; OFL.txt is the licence).
// Anything outside the subset falls back to the next font in the stack.

// Geist Sans, with the package's own settings: preloaded, as the text face.
export const GeistSans = localFont({
  src: '../fonts/Geist-Latin.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
})

// Geist Mono, declared here rather than imported from 'geist/font/mono' for
// one option: preload. The package preloads it, so every page fetched 71 KB
// of monospace font alongside the main font and scripts, competing with them
// at the start of the load, for text that is only ever dates, reading times
// and small labels. Unpreloaded, the browser fetches it when that text is
// laid out, and it swaps in like any other webfont. Every other setting
// matches the package's own declaration.
export const GeistMono = localFont({
  src: '../fonts/GeistMono-Latin.woff2',
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
