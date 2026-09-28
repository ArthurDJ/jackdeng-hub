/**
 * One step of mulberry32: the value in [0, 1) and the next state. For code
 * that keeps its random state in plain data (a game's reducer, say) so the
 * same seed replays the same run.
 */
export function mulberry32(state: number): [number, number] {
  const a = (state + 0x6d2b79f5) >>> 0
  let x = a
  x = Math.imul(x ^ (x >>> 15), x | 1)
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
  return [((x ^ (x >>> 14)) >>> 0) / 4294967296, a]
}

/** A small, fast, seedable PRNG (mulberry32), so a test gets the same "random" run twice. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    const [v, next] = mulberry32(a)
    a = next
    return v
  }
}
