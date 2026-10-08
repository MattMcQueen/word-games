/**
 * Lockout: eight letters are locked out for the day and one is required.
 * Find the longest word that uses the required letter and none of the banned ones.
 */

export const SLUG = 'lockout';
export const NAME = 'Lockout';

export const BANNED_COUNT = 8;

/**
 * Difficulty bounds. With eight random letters banned, the longest word is
 * usually 12–16 letters (and obscure), so we keep only days where it's 7–10,
 * with at most MAX_BEST_ANSWERS of them and at least MIN_TOTAL words in all.
 */
export const MIN_BEST = 7;
export const MAX_BEST = 10;
export const MAX_BEST_ANSWERS = 10;
export const MIN_TOTAL = 20;

export interface LockoutPuzzle {
  /** The letter every word must contain. */
  required: string;
  /** The locked-out letters, alphabetically. */
  banned: string;
}

export interface LockoutSolution {
  bestLength: number;
  /** Every allowed word of the longest length. */
  answers: string[];
  /** How many allowed words there are in all. */
  total: number;
}

/** The banned letters in `word`, in order of first appearance. */
export function bannedIn(word: string, banned: string): string[] {
  return [...new Set([...word].filter((ch) => banned.includes(ch)))];
}

export const isAllowed = (word: string, puzzle: LockoutPuzzle) =>
  word.includes(puzzle.required) && bannedIn(word, puzzle.banned).length === 0;
