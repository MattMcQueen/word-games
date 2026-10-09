/** Halves' game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { acceptHalves, generateHalves } from './generate.ts';
import { solveHalves } from './solve.ts';
import { type HalvesPuzzle, type HalvesSolution, SLUG } from './spec.ts';

export const halvesLogic: GameLogic<HalvesPuzzle, HalvesSolution> = {
  slug: SLUG,
  needs: ['common'],
  generate: generateHalves,
  solve: solveHalves,
  accept: acceptHalves,
};
