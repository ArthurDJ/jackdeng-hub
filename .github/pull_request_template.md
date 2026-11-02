<!--
Title: English conventional commit, e.g. `fix(blog): …`. PRs are squash-merged,
so the title becomes the commit on main.
The checklist is CLAUDE.md's 「每个 PR 都要做的事」. Tick what is done, strike
through (~~…~~) what does not apply and say why, leave the rest open.
-->

## What

<!-- What changes and why. Link the issue or the earlier PR this follows from. -->

## How verified

<!-- What you ran and looked at, with results: commands, pages and widths,
dry-run output, screenshots. "Tests pass" alone is not verification (#134). -->

## Checklist

- [ ] `CHANGELOG.md`: new version section, entry grouped Added / Changed / Fixed / Removed / Security, heading ends with this PR's number (Changelog Protocol in `AI_DEPLOY.md`)
- [ ] `PROJECT_ROADMAP.md`: row in 技术债清单 for anything fixed, and 「最后更新」 at the end of the file
- [ ] `npm run typecheck && npm test && npm run i18n:check && npm run lint` pass locally
- [ ] `/code-review` (high) run on this PR; confirmed findings fixed in this PR, not a follow-up
- [ ] Local browser check of anything visible: en + zh, 375px width. Rendering path changed → checked with `next build && next start`, not only `next dev` (#26)
- [ ] After deploy: the changed pages opened and used on https://jackdeng.cc (CI and the daily smoke check only prove pages load)
- [ ] Migration? None, or hand-written (not `migrate:create`), and run on production with `npm run migrate` after approval — before the deploy if additive only
- [ ] Production DB writes? None, or approved and run with `--apply`; say what was written
