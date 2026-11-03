import {
  CONTACT_EMAIL,
  EDUCATION,
  PROFILE_LINKS,
  SKILLS,
  TIMELINE,
  printableUrl,
} from '../../src/lib/profile'

/**
 * The résumé, rendered from the same data as the home and About pages so the
 * PDF cannot drift from the site again. The April 2026 PDF was printed from a
 * one-off page that was never committed; by October it still said "0-to-1",
 * Drizzle ORM and edge routing, all of which the site had since corrected.
 *
 * Projects are the one part the site keeps in the database, so their résumé
 * lines live here. Keep them in step with the project pages, but vaguer about
 * the employer: no vendor or supplier names, no go-live months.
 */
export const RESUME_PROJECTS = [
  {
    name: 'DataHub',
    tech: 'C#, .NET 10, ASP.NET Core, Hangfire, Vue 3',
    year: '2026',
    bullets: [
      'Consolidated a 3-service legacy integration platform into one ASP.NET Core app with 345 API endpoints, cut over only after an automated reconciliation harness diffed every endpoint; 130+ releases in under 6 weeks.',
      'Built a supplier EDI exchange over SFTP that fails closed: all 9 export paths are gated, the archive is append-only at 3 layers, and a missed pickup alerts within 30 min; tests grew from about 2,200 to 5,100+.',
    ],
  },
  {
    name: 'B2B Customer Portal',
    tech: 'C#, .NET 10, EF Core, React 19, ERP integration',
    year: '2026',
    bullets: [
      'Built a B2B ordering portal on the company ERP with real-time stock and quote-to-order; 60+ releases in a month.',
      "ERP writes are idempotent, keyed by the portal's order number, and dry-run first; 1,800+ tests (1,411 .NET, 393 client).",
    ],
  },
  {
    name: 'Order Tracking Portal',
    tech: 'C#, .NET 10, Vue 3, Playwright',
    year: '2026',
    bullets: [
      "Read-only portal for B2B customers' orders, per-unit production status and invoices; 32 releases in its first 2 weeks.",
      'CI blocks internal system names in customer-facing code; 424 backend tests; 47 UI components spun out as a shared kit.',
    ],
  },
  {
    name: 'jackdeng.cc',
    tech: 'Next.js, Payload CMS, PostgreSQL, Vercel',
    year: '2026',
    bullets: [
      'Next.js 16 + Payload CMS 3, bilingual; 138 merged PRs; CI now runs 425 tests, a schema-drift check and a smoke test.',
    ],
  },
]

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The résumé as one self-contained HTML page, sized for US Letter. */
export function renderResumeHtml(): string {
  // Spelled out, since paper cannot be clicked; the PDF keeps them as links.
  const contacts = [
    { href: `mailto:${CONTACT_EMAIL}` },
    ...PROFILE_LINKS.filter((l) => l.href.startsWith('https://')),
    { href: 'https://jackdeng.cc' },
  ]
    .map(({ href }) => `<a href="${esc(href)}">${esc(printableUrl(href))}</a>`)
    .join('<span class="sep">·</span>')

  const skills = SKILLS.map(
    ({ group, items }) => `<li><b>${esc(group.en)}:</b> ${esc(items.join(', '))}</li>`,
  ).join('')

  const experience = TIMELINE.map(
    ({ role, place, location, year, bullets }) => `
      <div class="entry">
        <div class="row"><span><b>${esc(place)}</b></span><span>${esc(location)}</span></div>
        <div class="row sub"><span>${esc(role.en)}</span><span>${esc(year.en.replace('present', 'Present'))}</span></div>
        <ul>${bullets.en.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
  ).join('')

  const projects = RESUME_PROJECTS.map(
    ({ name, tech, year, bullets }) => `
      <div class="entry">
        <div class="row"><span><b>${esc(name)}</b> <span class="tech">${esc(tech)}</span></span><span>${esc(year)}</span></div>
        <ul>${bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
  ).join('')

  const education = EDUCATION.map(
    ({ school, degree, year }) =>
      `<div class="row edu"><span><b>${esc(school)}</b> | ${esc(degree.en)}</span><span>${esc(year.en.replace('present', 'Present'))}</span></div>`,
  ).join('')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Jie (Jack) Deng - Resume</title>
<style>
  @page { size: Letter; margin: 0.45in 0.55in; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 9.5pt/1.3 "Helvetica Neue", Helvetica, Arial, sans-serif; color: #111; }
  a { color: inherit; text-decoration: none; }
  h1 { font-size: 19pt; font-weight: 600; text-align: center; margin: 0 0 3pt; letter-spacing: 0.2pt; }
  .contact { text-align: center; font-size: 9pt; color: #333; }
  .sep { margin: 0 5pt; color: #999; }
  h2 { font-size: 10.5pt; font-weight: 700; letter-spacing: 0.6pt; text-transform: uppercase;
       border-bottom: 0.75pt solid #111; margin: 9pt 0 4pt; padding-bottom: 1.5pt; }
  ul { margin: 2pt 0 0; padding-left: 13pt; }
  li { margin: 1pt 0; }
  .skills { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; column-gap: 16pt; }
  .skills li { margin: 1pt 0; }
  .entry { margin-bottom: 5pt; break-inside: avoid; }
  .row { display: flex; justify-content: space-between; gap: 12pt; }
  .row > span:last-child { white-space: nowrap; }
  .sub { font-style: italic; }
  .tech { font-weight: 400; color: #444; font-style: italic; margin-left: 4pt; }
  .edu { margin: 1.5pt 0; }
</style>
</head>
<body>
  <h1>Jie (Jack) Deng</h1>
  <div class="contact">${contacts}</div>

  <h2>Skills</h2>
  <ul class="skills">${skills}</ul>

  <h2>Experience</h2>
  ${experience}

  <h2>Projects</h2>
  ${projects}

  <h2>Education</h2>
  ${education}
</body>
</html>
`
}
