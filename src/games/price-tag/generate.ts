import { hasEverydayAnswer } from '../../core/dictionary.ts';
import type { GenerateContext } from '../../core/game.ts';
/**
 * Price Tag generator: random prices and budget, then keep the puzzle only if
 * its optimum is an interesting length (see MIN/MAX_BEST_LENGTH in spec.ts).
 */

import type { Rng } from '../../core/rng.ts';
import {
  MAX_BEST_LENGTH,
  MAX_BUDGET,
  MAX_PRICE,
  MIN_BEST_LENGTH,
  MIN_BUDGET,
  MIN_PRICE,
  type PriceTagPuzzle,
  type PriceTagSolution,
} from './spec.ts';

export function generatePriceTag(rng: Rng): PriceTagPuzzle {
  const prices = Array.from({ length: 26 }, () => rng.int(MIN_PRICE, MAX_PRICE));
  return { prices, budget: rng.int(MIN_BUDGET, MAX_BUDGET) };
}

/** Difficulty bounds, and at least one best answer must be an everyday word. */
export function acceptPriceTag(
  _puzzle: PriceTagPuzzle,
  solution: PriceTagSolution,
  ctx: GenerateContext,
): boolean {
  return (
    hasEverydayAnswer(solution.answers, ctx.common) &&
    solution.bestLength >= MIN_BEST_LENGTH &&
    solution.bestLength <= MAX_BEST_LENGTH
  );
}
