/** Lockout's game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { acceptLockout, generateLockout } from './generate.ts';
import { solveLockout } from './solve.ts';
import { type LockoutPuzzle, type LockoutSolution, SLUG } from './spec.ts';

export const lockoutLogic: GameLogic<LockoutPuzzle, LockoutSolution> = {
  slug: SLUG,
  generate: generateLockout,
  solve: solveLockout,
  accept: acceptLockout,
};
