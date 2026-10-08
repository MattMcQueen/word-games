/**
 * Every game's logic, for the puzzle generator script. (Pages import only
 * their own game, so this file never ends up in the browser bundle.)
 */

import type { GameLogic } from '../core/game.ts';
import { cleanSweepLogic } from './clean-sweep/logic.ts';
import { keyhopLogic } from './keyhop/logic.ts';
import { lockoutLogic } from './lockout/logic.ts';
import { matryoshkaLogic } from './matryoshka/logic.ts';
import { priceTagLogic } from './price-tag/logic.ts';
import { swapShopLogic } from './swap-shop/logic.ts';
import { threaderLogic } from './threader/logic.ts';

export const ALL_GAMES: readonly GameLogic<unknown, unknown>[] = [
  priceTagLogic,
  threaderLogic,
  swapShopLogic,
  matryoshkaLogic,
  cleanSweepLogic,
  keyhopLogic,
  lockoutLogic,
];
