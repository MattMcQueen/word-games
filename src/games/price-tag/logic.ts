/** Price Tag's game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { acceptPriceTag, generatePriceTag } from './generate.ts';
import { solvePriceTag } from './solve.ts';
import { type PriceTagPuzzle, type PriceTagSolution, SLUG } from './spec.ts';

export const priceTagLogic: GameLogic<PriceTagPuzzle, PriceTagSolution> = {
  slug: SLUG,
  needs: ['common'],
  generate: generatePriceTag,
  solve: solvePriceTag,
  accept: acceptPriceTag,
};
