#!/usr/bin/env python3
"""Fetch the site the way a visitor would and fail on anything broken.

    python3 scripts/smoke.py https://www.jackdeng.cc     # production, after each deploy
    python3 scripts/smoke.py http://localhost:3000       # CI, on the seeded build

Why it exists: PR #26 turned every blog post into a 500 while `typecheck`,
`npm test` and the build all passed. The error was thrown at request time and
nothing fetched a page. Four checks, all read-only:

1. The routes a build cannot check answer 200 without a server error inside.
2. Made-up URLs answer 404.
3. Every internal link on every sitemap page resolves without a redirect.
4. The site enforces the content security policy; /admin only reports.

Standard library only, so it runs on a bare runner with no install step.
"""
import json
import re
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else sys.exit(__doc__)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


follow = urllib.request.build_opener()
no_follow = urllib.request.build_opener(NoRedirect)


def get(path, redirects=True):
    """Status and body. HTTP errors are answers, not exceptions."""
    opener = follow if redirects else no_follow
    try:
        with opener.open(BASE + path, timeout=30) as r:
            return r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')


def first_slug(collection):
    """A slug the public API lists, rather than one hardcoded that a rename breaks.
    Anonymous callers only get published posts and online public tools."""
    status, body = get(f'/api/{collection}?limit=1&depth=0')
    if status != 200:
        return None
    docs = json.loads(body).get('docs') or []
    return docs[0].get('slug') if docs else None


failed = False


def fail(message):
    global failed
    failed = True
    print('FAIL ' + message)


# ── 1. Pages that must render ──────────────────────────────────────────────
routes = ['/en', '/zh', '/en/blog', '/zh/blog', '/en/projects', '/en/tools',
          '/zh/about', '/robots.txt', '/sitemap.xml', '/feed.xml']

# A post detail page is statically rendered, which is exactly why #26 broke
# it in a way nothing else caught. Both locales. Same for a tool page.
for collection, prefix in (('blogs', 'blog'), ('tools', 'tools')):
    slug = first_slug(collection)
    if slug:
        routes += [f'/en/{prefix}/{slug}', f'/zh/{prefix}/{slug}']
    else:
        print(f'note: no public {collection}, skipping their detail pages')

# A 200 is not enough on its own. /blog and /projects sit under a loading.tsx,
# so the status is committed before the page renders (#34), and a query that
# throws there still goes out as a 200 with error.tsx streamed in. Next marks
# that in the HTML as a numeric data-dgst; the non-numeric ones
# (BAILOUT_TO_CLIENT_SIDE_RENDERING) are normal.
for route in routes:
    status, body = get(route)
    if status != 200:
        fail(f'{status}  {route}')
    elif re.search(r'data-dgst="[0-9]+"', body):
        fail(f'{status}  {route}  (server error rendered under a 200)')
    else:
        print(f'ok   {status}  {route}')

# ── 2. Pages that must not exist ───────────────────────────────────────────
# #34 shipped five routes that answered a made-up slug with a 200 and a 404
# page: loading.tsx had pulled the detail routes into the same Suspense
# boundary, so notFound() ran after the 200 was sent, and search engines were
# free to index any URL anyone invented. One probe per route that calls
# notFound(), plus two that no route claims (#57): a path under a locale, which
# used to fall through to the bare root 404, and a path with a dot, which skips
# the middleware and used to answer 500, the shape of every scanner probe.
nope = 'ci-smoke-probe-no-such-slug'
for route in (f'/en/blog/{nope}', f'/zh/blog/{nope}', f'/en/tools/{nope}',
              f'/en/projects/{nope}', f'/en/blog/category/{nope}',
              f'/en/blog/tag/{nope}', f'/en/{nope}/deeper', f'/{nope}.php'):
    status, _ = get(route)
    if status == 404:
        print(f'ok   {status}  {route}  (absent, and says so)')
    else:
        fail(f'{status}  {route}  (a made-up URL must answer 404)')

# ── 2b. A draft stays private ──────────────────────────────────────────────
# CI seeds a draft and names it here. Its page must answer 404 and nothing in
# that response may carry its title: the post page's metadata once found
# drafts, and Next ships a 404's metadata in the RSC payload (#89).
import os
draft_slug, draft_title = os.environ.get('SMOKE_DRAFT_SLUG'), os.environ.get('SMOKE_DRAFT_TITLE')
if draft_slug and draft_title:
    for locale in ('en', 'zh'):
        route = f'/{locale}/blog/{draft_slug}'
        status, body = get(route)
        if status != 404:
            fail(f'{status}  {route}  (a draft must answer 404)')
        elif draft_title in body:
            fail(f'{status}  {route}  (the draft\'s title is in the 404 response)')
        else:
            print(f'ok   {status}  {route}  (draft, private)')

# ── 3. Every internal link, without following redirects ───────────────────
# The checks above fetch a fixed list, so they never looked at the links a
# visitor clicks: the home page's project cards pointed at /en/en/projects/…
# and 404'd for months, and most blog links were bare /blog/… paths that each
# cost a 307 through the locale middleware. Sitemap URLs carry the site's
# public host, so only their paths are used: that way this also works on a
# local build.
_, sitemap = get('/sitemap.xml')
pages = sorted({re.sub(r'^https?://[^/]+', '', u) for u in re.findall(r'<loc>([^<]+)</loc>', sitemap)})
skip = ('/_next', '/api', '/admin', '/og', '/icon', '/apple-icon', '/favicon')
links = {}
for page in pages:
    status, html = get(page, redirects=False)
    if status != 200:
        fail(f'{status}  {page}  (listed in the sitemap)')
        continue
    for href in set(re.findall(r'href="(/[^"#?]*)', html)):
        if href.startswith(skip) or '.' in href.rsplit('/', 1)[-1]:
            continue
        links.setdefault(href, page)

for href, page in sorted(links.items()):
    if re.match(r'^/(en|zh)/(en|zh)(/|$)', href):
        why = 'locale prefix doubled'
    elif not re.match(r'^/(en|zh)(/|$)', href):
        why = 'no locale prefix: every click is a 307 through the middleware'
    else:
        status, _ = get(href, redirects=False)
        why = None if status == 200 else f'answers {status}'
    if why:
        fail(f'{href}  (linked from {page}) — {why}')

print(f'{len(pages)} sitemap pages, {len(links)} distinct internal links')

# ── 4. The content security policy ────────────────────────────────────────
# Enforced on the site, report-only on /admin (next.config.mjs), each chosen
# by one path pattern. A slip in either pattern drops a policy without
# breaking a single page, so nothing else would notice.
def headers(path):
    try:
        with no_follow.open(BASE + path, timeout=30) as r:
            return r.headers
    except urllib.error.HTTPError as e:
        return e.headers


for path, admin in (('/en', False), (f'/zh/{nope}/deeper', False), ('/api/search', False),
                    ('/admin', True), ('/admin/login', True)):
    h = headers(path)
    enforced, trial = h.get('Content-Security-Policy', ''), h.get('Content-Security-Policy-Report-Only', '')
    if admin:
        ok = enforced == "frame-ancestors 'self'" and "default-src 'self'" in trial
    else:
        ok = "default-src 'self'" in enforced and "'unsafe-eval'" not in enforced and not trial
    if ok:
        print(f'ok   CSP  {path}  ({"report-only" if admin else "enforced"})')
    else:
        fail(f'CSP  {path}  (enforced: {enforced or "none"}; report-only: {trial or "none"})')

print('FAIL' if failed else 'all ok')
sys.exit(1 if failed else 0)
