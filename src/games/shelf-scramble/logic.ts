/** Shelf Scramble's game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { acceptShelfScramble, generateShelfScramble } from './generate.ts';
import { solveShelfScramble } from './solve.ts';
import { type ShelfScramblePuzzle, type ShelfScrambleSolution, SLUG } from './spec.ts';

export const shelfScrambleLogic: GameLogic<ShelfScramblePuzzle, ShelfScrambleSolution> = {
  slug: SLUG,
  generate: generateShelfScramble,
  solve: solveShelfScramble,
  accept: acceptShelfScramble,
};
