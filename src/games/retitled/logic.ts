/** Retitled's game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { acceptRetitled, generateRetitled } from './generate.ts';
import { solveRetitled } from './solve.ts';
import { type RetitledPuzzle, type RetitledSolution, SLUG } from './spec.ts';

export const retitledLogic: GameLogic<RetitledPuzzle, RetitledSolution> = {
  slug: SLUG,
  generate: generateRetitled,
  solve: solveRetitled,
  accept: acceptRetitled,
};
