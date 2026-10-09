/**
 * Halves: twelve word-halves, jumbled. Join them in pairs to make six words
 * (SUN + DAY, CUP + BOARD…). There's exactly one way to pair every half, so a
 * real word that isn't one of the day's six is a decoy, not an answer.
 */

export const SLUG = 'halves';
export const NAME = 'Halves';

export const WORDS_PER_DAY = 6;

/** Each half has 3–6 letters. */
export const MIN_HALF = 3;
export const MAX_HALF = 6;

export interface HalvesPuzzle {
  /** The twelve halves, shuffled. */
  halves: string[];
}

export interface HalvesSolution {
  /** The six words, each as [first half, second half], in the order the halves first appear. */
  words: [string, string][];
}
