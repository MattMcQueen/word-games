/** Threader solver: one pass over the dictionary, keeping the shortest words that contain the thread. */

import { everydayFirst } from '../../core/dictionary.ts';
import type { GenerateContext } from '../../core/game.ts';
import { containsInOrder } from '../../solvers/letters.ts';
import type { ThreaderPuzzle, ThreaderSolution } from './spec.ts';

export function solveThreader(
  puzzle: ThreaderPuzzle,
  { dict, common }: GenerateContext,
): ThreaderSolution {
  let bestLength = Number.POSITIVE_INFINITY;
  let answers: string[] = [];
  let total = 0;

  for (const word of dict.words) {
    if (!containsInOrder(word, puzzle.letters)) continue;
    total++;
    if (word.length < bestLength) {
      bestLength = word.length;
      answers = [word];
    } else if (word.length === bestLength) {
      answers.push(word);
    }
  }

  return { bestLength: total > 0 ? bestLength : 0, answers: everydayFirst(answers, common), total };
}
