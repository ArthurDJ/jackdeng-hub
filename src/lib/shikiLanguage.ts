import { bundledLanguages, bundledLanguagesAlias } from 'shiki'

/**
 * The editor's Code block offers Monaco's language ids (CodeBlock() in
 * payload.config.ts); Shiki names some of them differently and does not
 * know others at all. This turns the stored id into one Shiki can render.
 *
 * Anything Shiki has no grammar for comes back as `text`, Shiki's built-in
 * plain mode: the block still renders, just uncoloured. A missing grammar
 * must never fail a page render — the post is still worth reading.
 */
const ALIASES: Record<string, string> = {
  // SQL dialects: Shiki has one SQL grammar, close enough for all three.
  mysql: 'sql',
  pgsql: 'sql',
  redshift: 'sql',
  // Azure CLI snippets are shell commands.
  azcli: 'shellscript',
  restructuredtext: 'rst',
  systemverilog: 'system-verilog',
  plaintext: 'text',
}

export const PLAIN = 'text'

export function shikiLanguage(editorLanguage: string | undefined | null): string {
  const id = (editorLanguage ?? '').trim().toLowerCase()
  if (!id) return PLAIN
  const mapped = ALIASES[id] ?? id
  if (mapped === PLAIN) return PLAIN
  return mapped in bundledLanguages || mapped in bundledLanguagesAlias ? mapped : PLAIN
}
