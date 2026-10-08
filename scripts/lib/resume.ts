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
 * lines live here. Keep them in step with the project pages.
 */
export const RESUME_PROJECTS = [
  {
    name: 'DataHub',
    tech: 'C#, .NET, ASP.NET Core',
    year: '2026',
    bullets: [
      'An internal data hub rewritten in C#/.NET: an older system split across three services became one ASP.NET Core application, in production since June 2026.',
      'Before cutover, a reconciliation tool diffed every endpoint between the old and new systems; releases ship only from version tags, and a failed post-deploy smoke test rolls back automatically.',
    ],
  },
  {
    name: 'B2B Customer Portal',
    tech: 'NetSuite, reverse proxy, CI',
    year: '2026',
    bullets: [
      'A customer portal backed by NetSuite, deployed to a company server in September 2026 and in internal use.',
      'Every ERP write is a dry run first and is keyed by the portal’s own order number, so a retried order is never sent twice.',
    ],
  },
  {
    name: 'jackdeng.cc',
    tech: 'Next.js, Payload CMS, PostgreSQL, Vercel',
    year: '2026',
    bullets: [
      'This personal site: Next.js 16 and Payload CMS 3 in one app on Supabase Postgres, deployed to Vercel, in English and Chinese.',
      'CI compares the schema the migrations build with the one the code defines, then seeds, builds and smoke-tests every pull request; the database is backed up nightly, encrypted.',
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
