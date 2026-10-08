/**
 * Hinge: each day has five pairs of words, like CAR … ROL. Find the hinge: the
 * word that finishes the first and starts the second (PET: CARPET, PETROL).
 * Each pair has exactly one answer. You can reveal a letter if you're stuck.
 */

import type { Dictionary } from '../../core/dictionary.ts';

export const SLUG = 'hinge';
export const NAME = 'Hinge';

export const PAIRS_PER_DAY = 5;

/** Fixed seed for the order hinge words are used in, a few each day. */
export const ORDER_SEED = 'hinge:order';

/** Hinges have 3–7 letters; the words either side 3–8. */
export const MIN_PART = 3;
export const MAX_HINGE = 7;
export const MAX_CLUE = 8;

export interface HingePair {
  left: string;
  right: string;
  /** Letters in the hinge. */
  length: number;
}

export interface HingePuzzle {
  /** Shortest hinge first. */
  pairs: HingePair[];
}

export interface HingeSolution {
  /** The hinge for each pair, in the same order. */
  answers: string[];
}

/** True if `word` hinges `pair`: left + word and word + right are both words. */
export const fits = (word: string, pair: HingePair, dict: Dictionary) =>
  word.length === pair.length && dict.has(pair.left + word) && dict.has(word + pair.right);
