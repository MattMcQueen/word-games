/**
 * Swap Shop generator: a random pair of letters and a random length rule;
 * acceptSwapShop keeps it only if it has a sensible number of pairs.
 */

import type { Rng } from '../../core/rng.ts';
import { ALPHABET } from '../../solvers/letters.ts';
import {
  LENGTH_OPTIONS,
  MAX_PAIRS,
  MIN_PAIRS,
  type SwapShopPuzzle,
  type SwapShopSolution,
} from './spec.ts';

export function generateSwapShop(rng: Rng): SwapShopPuzzle {
  const [a, b] = rng
    .shuffle([...ALPHABET])
    .slice(0, 2)
    .sort();
  return { letters: `${a}${b}`, length: rng.pick(LENGTH_OPTIONS) };
}

export function acceptSwapShop(_puzzle: SwapShopPuzzle, solution: SwapShopSolution): boolean {
  return solution.pairs.length >= MIN_PAIRS && solution.pairs.length <= MAX_PAIRS;
}
