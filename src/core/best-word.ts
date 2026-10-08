/** Picking the player's best word, for games where only your best word counts. */

/** Positive if word a beats word b, negative if b beats a, zero if equal. */
export type CompareWords = (a: string, b: string) => number;

/** The best word under `compare` (the first found wins a tie), or null for an empty list. */
export function bestWord(words: readonly string[], compare: CompareWords): string | null {
  let best: string | null = null;
  for (const word of words) if (best === null || compare(word, best) > 0) best = word;
  return best;
}
