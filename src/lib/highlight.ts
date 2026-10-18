import { createHighlighter, createJavaScriptRegexEngine, type Highlighter } from 'shiki'
import { PLAIN, shikiLanguage } from './shikiLanguage'

/**
 * Server-side syntax highlighting for the editor's Code blocks.
 *
 * Runs in server components only (src/components/CodeBlock.tsx guards that
 * with `server-only`), so none of Shiki reaches the browser: the page ships
 * coloured HTML and no highlighter.
 *
 * Both themes are rendered at once as CSS variables (`defaultColor: false`):
 * each token carries `--shiki-light` and `--shiki-dark`, and globals.css picks
 * one by the `.dark` class next-themes puts on <html>. Switching theme is a
 * CSS change, not a re-render, and the cached page is the same for everyone.
 *
 * The JavaScript regex engine instead of Oniguruma: no WASM to bundle into the
 * server build. `forgiving` lets the odd pattern it cannot translate match
 * nothing rather than throw — a slightly less coloured block, never a 500.
 *
 * Themes are chosen for contrast on *our* block background (--bg-elevated:
 * #f5f5f5 / #171717), held to the same WCAG AA bar as the rest of the site
 * (#56). The classic github-light / github-dark pair fails it there — four
 * light colours between 3.2 and 4.4:1, dark comments at 3.7:1. GitHub's newer
 * Primer pair passes everywhere but one colour: light-mode comments, #6e7781 at
 * 4.17:1, swapped for Primer's own muted-text grey #59636e (5.61:1). Worst case
 * after that: 4.63:1 light, 5.83:1 dark. highlight.test.ts holds the line.
 */
export const THEMES = { light: 'github-light-default', dark: 'github-dark-default' } as const

const COLOR_REPLACEMENTS = {
  [THEMES.light]: { '#6e7781': '#59636e' },
}

let highlighter: Promise<Highlighter> | undefined

function getHighlighter(): Promise<Highlighter> {
  highlighter ??= createHighlighter({
    themes: [THEMES.light, THEMES.dark],
    langs: [],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  })
  return highlighter
}

export async function highlight(code: string, editorLanguage?: string | null): Promise<string> {
  const h = await getHighlighter()
  const lang = shikiLanguage(editorLanguage)
  if (lang !== PLAIN && !h.getLoadedLanguages().includes(lang)) {
    await h.loadLanguage(lang as Parameters<Highlighter['loadLanguage']>[0])
  }
  return h.codeToHtml(code, {
    lang,
    themes: THEMES,
    defaultColor: false,
    colorReplacements: COLOR_REPLACEMENTS,
  })
}
