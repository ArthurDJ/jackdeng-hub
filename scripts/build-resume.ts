import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { renderResumeHtml } from './lib/resume'

/**
 * Prints the résumé to public/resume.pdf with headless Chrome, and copies it
 * to the /en and /zh paths that older links still use. Reads no database and
 * no environment: the content is src/lib/profile.ts plus the project lines in
 * scripts/lib/resume.ts.
 *
 *   npm run resume
 *   CHROME=/path/to/chrome npm run resume   # Chrome somewhere else
 *
 * Fails if the PDF runs past one page.
 */
const chrome =
  process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if (!existsSync(chrome)) {
  console.error(`Chrome not found at ${chrome}; set CHROME to its path.`)
  process.exit(1)
}

const dir = mkdtempSync(join(tmpdir(), 'resume-'))
const html = join(dir, 'resume.html')
const pdf = join(dir, 'resume.pdf')
writeFileSync(html, renderResumeHtml())

execFileSync(
  chrome,
  [
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${pdf}`,
    pathToFileURL(html).href,
  ],
  { stdio: 'ignore' },
)

const pages = (readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
if (pages !== 1) {
  console.error(`The résumé came out at ${pages} pages; it has to fit on one. HTML kept at ${html}`)
  process.exit(1)
}

for (const out of ['public/resume.pdf', 'public/en/resume.pdf', 'public/zh/resume.pdf']) {
  copyFileSync(pdf, out)
  console.log(`wrote ${out}`)
}
