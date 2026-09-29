/**
 * Project text kept as markdown outside the repo, in
 * $DRAFTS_DIR/projects/<slug>.<locale>.md: the first paragraph is the short
 * description, the rest the long one. Used by add-projects.ts and
 * patch-projects.ts.
 */
import fs from 'fs'
import path from 'path'

export function splitDraft(md: string, file = 'draft') {
  const text = md.replace(/\r\n/g, '\n').trim()
  const cut = text.indexOf('\n\n')
  if (cut < 0) throw new Error(`${file}: needs a first paragraph and a body`)
  return { short: text.slice(0, cut).trim(), body: text.slice(cut).trim() }
}

export function readDraft(slug: string, locale: string) {
  const dir = process.env.DRAFTS_DIR
  if (!dir) throw new Error('set DRAFTS_DIR to the folder holding projects/<slug>.<locale>.md')
  const file = path.join(dir, 'projects', `${slug}.${locale}.md`)
  return splitDraft(fs.readFileSync(file, 'utf8'), file)
}
