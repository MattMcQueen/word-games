/**
 * Price Tag solver: a single pass over the dictionary keeping the best
 * (length, cost) seen among affordable words. ~60k words, so it's instant.
 */

import type { GenerateContext } from '../../core/game.ts';
import { compareScores, type PriceTagPuzzle, type PriceTagSolution, wordCost } from './spec.ts';

export function solvePriceTag(puzzle: PriceTagPuzzle, { dict }: GenerateContext): PriceTagSolution {
  let best = { length: 0, cost: 0 };
  let answers: string[] = [];

  for (const word of dict.words) {
    const cost = wordCost(word, puzzle.prices);
    if (cost > puzzle.budget) continue;
    const cmp = compareScores({ length: word.length, cost }, best);
    if (cmp > 0) {
      best = { length: word.length, cost };
      answers = [word];
    } else if (cmp === 0) {
      answers.push(word);
    }
  }

  return { bestLength: best.length, bestCost: best.cost, answers };
}
