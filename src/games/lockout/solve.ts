/** Lockout solver: one pass over the dictionary, keeping the longest allowed words. */

import { everydayFirst } from '../../core/dictionary.ts';
import type { GenerateContext } from '../../core/game.ts';
import { isAllowed, type LockoutPuzzle, type LockoutSolution } from './spec.ts';

export function solveLockout(
  puzzle: LockoutPuzzle,
  { dict, common }: GenerateContext,
): LockoutSolution {
  let bestLength = 0;
  let answers: string[] = [];
  let total = 0;
  for (const word of dict.words) {
    if (!isAllowed(word, puzzle)) continue;
    total++;
    if (word.length > bestLength) {
      bestLength = word.length;
      answers = [word];
    } else if (word.length === bestLength) {
      answers.push(word);
    }
  }
  return { bestLength, answers: everydayFirst(answers, common), total };
}
