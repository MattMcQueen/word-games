/**
 * Threader: given 3 or 4 letters in a fixed order (say R, N, T), find the
 * shortest word that contains them in that order, not necessarily next to
 * each other: RaNT, RuNT, ...
 */

export const SLUG = 'threader';
export const NAME = 'Threader';

/** How many letters the thread has; one is chosen at random each day. */
export const THREAD_LENGTHS = [3, 4] as const;

/** Threads are taken from a random word of this many letters, so they're always solvable. */
export const MIN_SOURCE_LENGTH = 6;
export const MAX_SOURCE_LENGTH = 10;

/**
 * Difficulty bounds:
 *  - the shortest answer needs MIN_EXTRA–MAX_EXTRA letters added to the thread
 *    (fewer is too easy, more makes the answers obscure);
 *  - at most MAX_BEST_ANSWERS words share the shortest length (more is too easy);
 *  - at least MIN_TOTAL words contain the thread, so everyone finds something.
 */
export const MIN_EXTRA = 2;
export const MAX_EXTRA = 4;
export const MAX_BEST_ANSWERS = 8;
export const MIN_TOTAL = 20;

export interface ThreaderPuzzle {
  /** The thread, lowercase, e.g. "rnt". */
  letters: string;
}

export interface ThreaderSolution {
  /** Length of the shortest word containing the thread. */
  bestLength: number;
  /** Every word of that length containing the thread, alphabetically. */
  answers: string[];
  /** How many words in the dictionary contain the thread at all. */
  total: number;
}

/** Shorter words are better: positive if a beats b. */
export const compareThreaded = (a: string, b: string) => b.length - a.length;

/** "R, N and T" for messages. */
export function threadInWords(letters: string): string {
  const upper = [...letters.toUpperCase()];
  return `${upper.slice(0, -1).join(', ')} and ${upper.at(-1)}`;
}
