/**
 * Swap Shop: two letters swap places for the day, say A ↔ E. Find words that
 * are still words after every A becomes E and every E becomes A, all at once:
 * BAT → BET, PANEL → PENAL, but not BEAN → BAEN. Each pair counts once, so BAT and
 * BET are a single find. Some days also fix the word length.
 *
 * The pairs to find are the everyday ones (both words familiar). Rarer pairs,
 * such as PONDS ↔ PONES, are accepted as bonuses but aren't needed for a
 * perfect day.
 */

export const SLUG = 'swap-shop';
export const NAME = 'Swap Shop';

/**
 * Each day uses words of any length (null) or one fixed length. Fixing the
 * length brings popular swaps like A ↔ E (300+ pairs in all) into range and
 * gives far more different puzzles than the 75 swaps that work unrestricted.
 */
export const LENGTH_OPTIONS: readonly (number | null)[] = [null, 4, 5, 6, 7];

/** Difficulty bounds: how many everyday pairs a day may have. */
export const MIN_PAIRS = 8;
export const MAX_PAIRS = 30;

export interface SwapShopPuzzle {
  /** The two letters that swap, in alphabetical order, e.g. "ae". */
  letters: string;
  /** Only words of this length count, or null for any length (3+). */
  length: number | null;
}

export interface SwapShopSolution {
  /**
   * The pairs to find, as "first/second" (alphabetical within and between pairs).
   * Each stands for a family: inflected pairs count as part of it (see `also`).
   */
  pairs: string[];
  /** For a pair with inflected forms, those pairs: "bat/bet" → ["bats/bets"]. */
  also: Record<string, string[]>;
  /**
   * Rarer pairs (families with no pair of everyday words), accepted as
   * bonuses. Missing from puzzles made before bonuses existed, where every
   * pair was one to find.
   */
  bonus?: string[];
}

/** True if a family head is a bonus pair rather than one of the pairs to find. */
export const isBonus = (key: string, solution: SwapShopSolution) =>
  solution.bonus?.includes(key) ?? false;

/** The pair to count when a player finds `key`: the head of its family. */
export function familyHead(key: string, solution: SwapShopSolution): string {
  if (solution.pairs.includes(key)) return key;
  for (const [head, members] of Object.entries(solution.also)) {
    if (members.includes(key)) return head;
  }
  return key;
}

/** Swap two letters everywhere in a word, simultaneously: swapLetters("bat", "a", "e") → "bet". */
export function swapLetters(word: string, a: string, b: string): string {
  let out = '';
  for (const ch of word) out += ch === a ? b : ch === b ? a : ch;
  return out;
}

/** The pair a word belongs to, as a stable key: "bat/bet" for either word. */
export const pairKey = (word: string, swapped: string) =>
  word < swapped ? `${word}/${swapped}` : `${swapped}/${word}`;

/** "BAT ↔ BET" for display. */
export const pairLabel = (key: string) => key.toUpperCase().replace('/', ' ↔ ');

/** "any length" or "5-letter words only", for the puzzle panel. */
export const lengthRule = (length: number | null) =>
  length === null ? 'Words of any length' : `${length}-letter words only`;
