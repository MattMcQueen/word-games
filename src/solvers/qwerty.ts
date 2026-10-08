/**
 * The QWERTY layout as data, shared by the on-screen keyboard and by Keyhop's
 * rules. Rows are staggered like a real keyboard: the middle row sits half a
 * key to the right of the top row, and the bottom row a whole key.
 */

export const QWERTY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const;
const ROW_OFFSETS = [0, 0.5, 1];

const position = new Map<string, { x: number; y: number }>();
QWERTY_ROWS.forEach((row, y) => {
  [...row].forEach((key, i) => position.set(key, { x: i + (ROW_OFFSETS[y] ?? 0), y }));
});

/**
 * How many single-key hops apart two letter keys are, moving to touching keys
 * (left, right, or the two above and below). The same key is 0 hops.
 *   keySteps('s', 'd') = 1, keySteps('s', 'e') = 1, keySteps('q', 'e') = 2
 */
export function keySteps(a: string, b: string): number {
  const p = position.get(a);
  const q = position.get(b);
  if (!p || !q) return Number.POSITIVE_INFINITY;
  const dy = Math.abs(p.y - q.y);
  const dx = Math.abs(p.x - q.x);
  // Each row change also moves half a key sideways for free.
  return dy + Math.max(0, Math.ceil(dx - dy / 2 - 1e-9));
}
