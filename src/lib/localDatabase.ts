// The only databases a schema push may ever touch: see the push option in
// payload.config.ts and scripts/schema-drift.ts. Production is a Supabase
// host, so anything that is not literally localhost is refused.
const LOCAL = /^postgres(ql)?:\/\/[^@/]*@(localhost|127\.0\.0\.1)(:\d+)?\/[^/]*$/

export function isLocalDatabaseUrl(url: string | undefined): boolean {
  return LOCAL.test(url ?? '')
}
