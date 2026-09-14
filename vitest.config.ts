import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // formatDate renders in the runner's local timezone, so without pinning
    // this a fixed instant lands on a different calendar day depending on
    // where the machine is. 2026-09-14T12:00:00Z reads as 15 September at
    // UTC+12, which would break the suite for a contributor in New Zealand
    // while CI, which runs in UTC, stayed green.
    env: { TZ: 'UTC' },
  },
})
