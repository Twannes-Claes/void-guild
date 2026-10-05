export const ROLL_REVEAL_MS = 1600

export function bustChance(max: number): string {
  const pct = 100 / (max + 1)
  return pct >= 10 ? pct.toFixed(0) : pct >= 0.1 ? pct.toFixed(1) : pct.toFixed(3)
}

export function heat(currentMax: number, start: number): number {
  if (start <= 0) return 1
  return Math.min(1, Math.max(0, 1 - Math.log(currentMax + 1) / Math.log(start + 1)))
}
