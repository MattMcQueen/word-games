/**
 * Threader generator: take a random word and keep 3 or 4 of its letters in
 * order. Because the thread comes from a real word it always has an answer;
 * acceptThreader then filters out threads that are too easy or too hard.
 */

import type { GenerateContext } from '../../core/game.ts';
import type { Rng } from '../../core/rng.ts';
import {
  MAX_BEST_ANSWERS,
  MAX_EXTRA,
  MAX_SOURCE_LENGTH,
  MIN_EXTRA,
  MIN_SOURCE_LENGTH,
  MIN_TOTAL,
  THREAD_LENGTHS,
  type ThreaderPuzzle,
  type ThreaderSolution,
} from './spec.ts';

export function generateThreader(rng: Rng, { dict }: GenerateContext): ThreaderPuzzle | null {
  const size = rng.pick(THREAD_LENGTHS);
  const candidates = dict.ofLength(rng.int(MIN_SOURCE_LENGTH, MAX_SOURCE_LENGTH));
  if (candidates.length === 0) return null;
  const source = rng.pick(candidates);

  // Choose `size` distinct positions, then read them left to right.
  const positions = rng
    .shuffle([...source].map((_, i) => i))
    .slice(0, size)
    .sort((a, b) => a - b);
  return { letters: positions.map((i) => source[i]).join('') };
}

export function acceptThreader(puzzle: ThreaderPuzzle, solution: ThreaderSolution): boolean {
  const extra = solution.bestLength - puzzle.letters.length;
  return (
    extra >= MIN_EXTRA &&
    extra <= MAX_EXTRA &&
    solution.answers.length <= MAX_BEST_ANSWERS &&
    solution.total >= MIN_TOTAL
  );
}
