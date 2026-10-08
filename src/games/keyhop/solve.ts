/** Keyhop solver: one pass over the dictionary, keeping the longest words that follow the rules. */

import type { GenerateContext } from '../../core/game.ts';
import { followsRules, type KeyhopPuzzle, type KeyhopSolution } from './spec.ts';

export function solveKeyhop(puzzle: KeyhopPuzzle, { dict }: GenerateContext): KeyhopSolution {
  let bestLength = 0;
  let answers: string[] = [];
  let total = 0;
  for (const word of dict.words) {
    if (!followsRules(word, puzzle)) continue;
    total++;
    if (word.length > bestLength) {
      bestLength = word.length;
      answers = [word];
    } else if (word.length === bestLength) {
      answers.push(word);
    }
  }
  return { bestLength, answers, total };
}
