/** Clean Sweep's game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { acceptCleanSweep, generateCleanSweep } from './generate.ts';
import { solveCleanSweep } from './solve.ts';
import { type CleanSweepPuzzle, type CleanSweepSolution, SLUG } from './spec.ts';

export const cleanSweepLogic: GameLogic<CleanSweepPuzzle, CleanSweepSolution> = {
  slug: SLUG,
  generate: generateCleanSweep,
  solve: (puzzle, ctx) => solveCleanSweep(puzzle, ctx),
  accept: acceptCleanSweep,
};
