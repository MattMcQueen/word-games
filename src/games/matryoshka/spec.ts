/**
 * Matryoshka: start from a 2–3 letter seed and build the longest chain of
 * words, each being the previous one with exactly one letter inserted
 * anywhere: AT → CAT → CHAT → CHATS → CHANTS. The seed itself needn't be a
 * word, but every word in the chain must be.
 */

export const SLUG = 'matryoshka';
export const NAME = 'Matryoshka';

/** Seeds are 2 or 3 letters cut from a random word of this length, so they're always word-like. */
export const MIN_SEED = 2;
export const MAX_SEED = 3;
export const MIN_SOURCE_LENGTH = 5;
export const MAX_SOURCE_LENGTH = 8;

/** Difficulty bounds on the longest chain (words after the seed). */
export const MIN_CHAIN = 5;
export const MAX_CHAIN = 7;
/** At least this many different first words, so the start isn't forced. */
export const MIN_FIRST_STEPS = 2;

/** How many example longest chains the solver keeps for the results. */
export const EXAMPLE_CHAINS = 3;

export interface MatryoshkaPuzzle {
  seed: string;
}

export interface MatryoshkaSolution {
  /** Length of the longest chain, not counting the seed. */
  best: number;
  /** Words that can follow the seed directly. */
  firstSteps: number;
  /** A few longest chains (seed excluded), ending in different words. */
  chains: string[][];
}

/** True if `longer` is `shorter` with exactly one letter inserted somewhere. */
export function isOneLetterInsertion(shorter: string, longer: string): boolean {
  if (longer.length !== shorter.length + 1) return false;
  let i = 0;
  while (i < shorter.length && shorter[i] === longer[i]) i++;
  return shorter.slice(i) === longer.slice(i + 1);
}

/** Where the new letter went: the index in `longer` of the inserted letter. */
export function insertedAt(shorter: string, longer: string): number {
  let i = 0;
  while (i < shorter.length && shorter[i] === longer[i]) i++;
  return i;
}
