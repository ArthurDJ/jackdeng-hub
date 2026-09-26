#!/usr/bin/env bash
# Vercel's "Ignored Build Step" (vercel.json → ignoreCommand): exit 0 skips
# the deployment, exit 1 lets it build.
#
# Only production builds. Preview deployments used to build every PR against
# the production database, with its credentials, because that was the only
# database there was; CI now builds each PR against a throwaway Postgres
# instead (the `typecheck` job in .github/workflows/ci.yml), and that check,
# unlike a preview, can block a merge. So a preview adds nothing but a copy
# of the production credentials in every PR's build, Dependabot's included.
#
# VERCEL_ENV is set during this step: production, preview or development.
# Skip only on an explicit preview or development. Anything else builds, so
# that if the variable ever went missing, production would keep deploying
# rather than stop without a word; a preview built by mistake just fails,
# since the Preview environment has no database URL.
echo "VERCEL_ENV=${VERCEL_ENV:-unset}"
case "$VERCEL_ENV" in
  preview | development)
    echo "Not production: skipping the build (see scripts/vercel-ignore-build.sh)."
    exit 0
    ;;
  *)
    echo "Building."
    exit 1
    ;;
esac
