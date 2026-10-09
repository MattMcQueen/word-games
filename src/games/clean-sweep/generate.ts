/**
 * Clean Sweep generator: pick 3 or 4 random words whose lengths add up to
 * TOTAL_LETTERS and jumble their letters, so there's always a sweep. The
 * solver then finds the true minimum, which may be fewer words.
 */

import type { GenerateContext } from '../../core/game.ts';
import type { Rng } from '../../core/rng.ts';
import {
  type CleanSweepPuzzle,
  type CleanSweepSolution,
  MAX_SOLUTIONS,
  MAX_WORDS,
  MIN_WORDS,
  SOURCE_LENGTHS,
  SOURCE_WORD_COUNTS,
  TOTAL_LETTERS,
} from './spec.ts';

export function generateCleanSweep(rng: Rng, { dict }: GenerateContext): CleanSweepPuzzle | null {
  const count = rng.pick(SOURCE_WORD_COUNTS);
  const [min, max] = SOURCE_LENGTHS[count] as [number, number];
  const lengths = Array.from({ length: count - 1 }, () => rng.int(min, max));
  const last = TOTAL_LETTERS - lengths.reduce((a, b) => a + b, 0);
  if (last < min || last > max) return null; // try again with other lengths
  lengths.push(last);

  const words = lengths.map((n) => rng.pick(dict.ofLength(n)));
  return { letters: rng.shuffle([...words.join('')]).join('') };
}

/** Difficulty bounds, and at least one best sweep must be made of everyday words. */
export function acceptCleanSweep(
  _puzzle: CleanSweepPuzzle,
  solution: CleanSweepSolution,
  ctx: GenerateContext,
) {
  const { common } = ctx;
  return (
    (!common || solution.examples.some((words) => words.every((w) => common.has(w)))) &&
    solution.min >= MIN_WORDS &&
    solution.min <= MAX_WORDS &&
    solution.solutions <= MAX_SOLUTIONS
  );
}
