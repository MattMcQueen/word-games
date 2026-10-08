/**
 * Keyhop: build words by hopping across the keyboard. The day sets a starting
 * key, a minimum length and a reach: each letter after the first must be
 * within that many keys of the one before (the same key counts too). Find the
 * longest word.
 *
 * The brief's first idea, "each letter next to the previous key", allows only
 * 34 words in the whole word list, too few for a daily game. A reach of two
 * keys gives over 500 words; mixing reaches of two and three gives about 43
 * different sets of answers.
 */

import { keySteps } from '../../solvers/qwerty.ts';

export const SLUG = 'keyhop';
export const NAME = 'Keyhop';

/** How far each hop may go, in keys; one is chosen each day. */
export const REACH_OPTIONS = [2, 3] as const;

/** The day's minimum word length is drawn from this range. */
export const MIN_LENGTH_RANGE: [number, number] = [4, 7];

/**
 * Difficulty bounds:
 *  - at least MIN_TOTAL valid words, so everyone finds something;
 *  - the longest is at least one letter over the minimum, so there's a stretch;
 *  - at most MAX_BEST_ANSWERS words share the longest length.
 */
export const MIN_TOTAL = 6;
export const MAX_BEST_ANSWERS = 6;

export interface KeyhopPuzzle {
  /** The letter every word starts with. */
  start: string;
  /** Words must have at least this many letters. */
  minLength: number;
  /** How many keys each hop may cover. */
  reach: number;
}

export interface KeyhopSolution {
  bestLength: number;
  /** Every valid word of the longest length. */
  answers: string[];
  /** How many valid words there are in all. */
  total: number;
}

/** True if `next` can follow `previous` with the given reach. */
export const canHop = (previous: string, next: string, reach: number) =>
  keySteps(previous, next) <= reach;

/** Index of the first letter that's too far from the one before it, or -1 if the whole word hops. */
export function firstBadHop(word: string, reach: number): number {
  for (let i = 1; i < word.length; i++) {
    if (!canHop(word[i - 1] as string, word[i] as string, reach)) return i;
  }
  return -1;
}

/** True if `word` obeys all of the day's rules (dictionary aside). */
export const followsRules = (word: string, puzzle: KeyhopPuzzle) =>
  word.startsWith(puzzle.start) &&
  word.length >= puzzle.minLength &&
  firstBadHop(word, puzzle.reach) === -1;
