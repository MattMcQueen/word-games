/**
 * Clean Sweep: about 15 jumbled letters. Use every letter exactly once in as
 * few words as possible.
 */

export const SLUG = 'clean-sweep';
export const NAME = 'Clean Sweep';

/** Puzzles are built from 3 or 4 random words with this many letters in all, so they're always solvable. */
export const TOTAL_LETTERS = 15;
export const SOURCE_WORD_COUNTS = [3, 4] as const;
/** Each source word's length, by how many words make up the puzzle. */
export const SOURCE_LENGTHS: Record<number, [min: number, max: number]> = {
  3: [4, 6],
  4: [3, 5],
};

/** Difficulty bounds on the fewest words that sweep every letter. */
export const MIN_WORDS = 3;
export const MAX_WORDS = 4;
/** More different best sweeps than this makes it too easy. */
export const MAX_SOLUTIONS = 40;
/** How many best sweeps the solver keeps to show in the results. */
export const EXAMPLE_SOLUTIONS = 3;

export interface CleanSweepPuzzle {
  /** The letters, jumbled, in the order shown. */
  letters: string;
}

export interface CleanSweepSolution {
  /** The fewest words that use every letter. */
  min: number;
  /** How many different best sweeps there are (counting stops at MAX_SOLUTIONS + 1). */
  solutions: number;
  /** A few best sweeps, each sorted alphabetically. */
  examples: string[][];
}
