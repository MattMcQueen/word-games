/**
 * Price Tag: every letter has a price from 1p to 9p and there's a budget.
 * Find the longest word you can afford; ties go to the word that spends
 * closest to the budget without going over.
 */

export const SLUG = 'price-tag';
export const NAME = 'Price Tag';

/** Letter prices are drawn uniformly from this range (pence). */
export const MIN_PRICE = 1;
export const MAX_PRICE = 9;

/** The daily budget is drawn from this range (pence). */
export const MIN_BUDGET = 20;
export const MAX_BUDGET = 32;

/**
 * Difficulty bounds on the optimum word length. Shorter is too easy; longer
 * tends to mean obscure answers nobody would think of.
 */
export const MIN_BEST_LENGTH = 7;
export const MAX_BEST_LENGTH = 9;

export interface PriceTagPuzzle {
  /** Price of each letter a–z in pence: prices[0] is A. */
  prices: number[];
  budget: number;
}

export interface PriceTagSolution {
  /** Length of the longest affordable word. */
  bestLength: number;
  /** The highest spend (≤ budget) among words of that length. */
  bestCost: number;
  /** Every word achieving bestLength and bestCost, alphabetically. */
  answers: string[];
}

/** A word's score: longer is better, then dearer (closer to the budget). */
export interface WordScore {
  length: number;
  cost: number;
}

/** Total price of a word in pence. */
export function wordCost(word: string, prices: readonly number[]): number {
  let total = 0;
  for (let i = 0; i < word.length; i++) total += prices[word.charCodeAt(i) - 97] ?? 0;
  return total;
}

/** Positive if a beats b, negative if b beats a, zero if equal. */
export const compareScores = (a: WordScore, b: WordScore) => a.length - b.length || a.cost - b.cost;
