/** Keyhop generator: a random starting key, minimum length and reach, kept if it makes a good puzzle. */

import type { Rng } from '../../core/rng.ts';
import { ALPHABET } from '../../solvers/letters.ts';
import {
  type KeyhopPuzzle,
  type KeyhopSolution,
  MAX_BEST_ANSWERS,
  MIN_LENGTH_RANGE,
  MIN_TOTAL,
  REACH_OPTIONS,
} from './spec.ts';

export function generateKeyhop(rng: Rng): KeyhopPuzzle {
  return {
    start: rng.pick([...ALPHABET]),
    minLength: rng.int(...MIN_LENGTH_RANGE),
    reach: rng.pick(REACH_OPTIONS),
  };
}

export function acceptKeyhop(puzzle: KeyhopPuzzle, solution: KeyhopSolution): boolean {
  return (
    solution.total >= MIN_TOTAL &&
    solution.bestLength > puzzle.minLength &&
    solution.answers.length <= MAX_BEST_ANSWERS
  );
}
