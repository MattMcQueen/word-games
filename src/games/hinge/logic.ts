/** Hinge's game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { acceptHinge, generateHinge } from './generate.ts';
import { solveHinge } from './solve.ts';
import { type HingePuzzle, type HingeSolution, SLUG } from './spec.ts';

export const hingeLogic: GameLogic<HingePuzzle, HingeSolution> = {
  slug: SLUG,
  needs: ['common'],
  generate: generateHinge,
  solve: solveHinge,
  accept: acceptHinge,
};
