/** Threader's game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { acceptThreader, generateThreader } from './generate.ts';
import { solveThreader } from './solve.ts';
import { SLUG, type ThreaderPuzzle, type ThreaderSolution } from './spec.ts';

export const threaderLogic: GameLogic<ThreaderPuzzle, ThreaderSolution> = {
  slug: SLUG,
  generate: generateThreader,
  solve: solveThreader,
  accept: acceptThreader,
};
