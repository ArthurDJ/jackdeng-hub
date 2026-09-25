// The only databases a schema push may ever touch: see the push option in
// payload.config.ts and scripts/schema-drift.ts. Production is a Supabase
// host, so anything that is not literally localhost is refused.
//
// No query string either: pg reads connection settings from it, and
// `?host=` replaces the host in the URL, so localhost/db?host=<remote>
// would connect to <remote>.
const LOCAL = /^postgres(ql)?:\/\/[^@/]*@(localhost|127\.0\.0\.1)(:\d+)?\/[^/?#]*$/

export function isLocalDatabaseUrl(url: string | undefined): boolean {
  return LOCAL.test(url ?? '')
}
