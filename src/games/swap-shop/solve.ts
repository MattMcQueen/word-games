/** Swap Shop solver: every word whose swapped twin is also a word, as pairs. */

import type { GenerateContext } from '../../core/game.ts';
import { pairKey, type SwapShopPuzzle, type SwapShopSolution, swapLetters } from './spec.ts';

export function solveSwapShop(puzzle: SwapShopPuzzle, { dict }: GenerateContext): SwapShopSolution {
  const [a = '', b = ''] = puzzle.letters;
  const words = puzzle.length === null ? dict.words : dict.ofLength(puzzle.length);
  const pairs: string[] = [];
  for (const word of words) {
    if (!word.includes(a) && !word.includes(b)) continue;
    const swapped = swapLetters(word, a, b);
    // Both words of a pair are in the list; count the pair once, from its first word.
    if (word < swapped && dict.has(swapped)) pairs.push(pairKey(word, swapped));
  }
  return { pairs: pairs.sort() };
}
