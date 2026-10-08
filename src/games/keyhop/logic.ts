/** Keyhop's game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { acceptKeyhop, generateKeyhop } from './generate.ts';
import { solveKeyhop } from './solve.ts';
import { type KeyhopPuzzle, type KeyhopSolution, SLUG } from './spec.ts';

export const keyhopLogic: GameLogic<KeyhopPuzzle, KeyhopSolution> = {
  slug: SLUG,
  generate: generateKeyhop,
  solve: solveKeyhop,
  accept: acceptKeyhop,
};
