/**
 * Every game's logic, for the puzzle generator script. (Pages import only
 * their own game, so this file never ends up in the browser bundle.)
 */

import type { GameLogic } from '../core/game.ts';
import { priceTagLogic } from './price-tag/logic.ts';
import { threaderLogic } from './threader/logic.ts';

export const ALL_GAMES: readonly GameLogic<unknown, unknown>[] = [priceTagLogic, threaderLogic];
