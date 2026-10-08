/** Swap Shop's game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { acceptSwapShop, generateSwapShop } from './generate.ts';
import { solveSwapShop } from './solve.ts';
import { SLUG, type SwapShopPuzzle, type SwapShopSolution } from './spec.ts';

export const swapShopLogic: GameLogic<SwapShopPuzzle, SwapShopSolution> = {
  slug: SLUG,
  generate: generateSwapShop,
  solve: solveSwapShop,
  accept: acceptSwapShop,
};
