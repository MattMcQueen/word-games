/** Lockout generator: one required and eight banned letters at random, kept if the longest word is a sensible length. */

import type { Rng } from '../../core/rng.ts';
import { ALPHABET } from '../../solvers/letters.ts';
import {
  BANNED_COUNT,
  type LockoutPuzzle,
  type LockoutSolution,
  MAX_BEST,
  MAX_BEST_ANSWERS,
  MIN_BEST,
  MIN_TOTAL,
} from './spec.ts';

export function generateLockout(rng: Rng): LockoutPuzzle {
  const [required = 'a', ...rest] = rng.shuffle([...ALPHABET]);
  return { required, banned: rest.slice(0, BANNED_COUNT).sort().join('') };
}

export function acceptLockout(_puzzle: LockoutPuzzle, solution: LockoutSolution): boolean {
  return (
    solution.bestLength >= MIN_BEST &&
    solution.bestLength <= MAX_BEST &&
    solution.answers.length <= MAX_BEST_ANSWERS &&
    solution.total >= MIN_TOTAL
  );
}
