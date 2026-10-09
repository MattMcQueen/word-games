/** Matryoshka's game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { acceptMatryoshka, generateMatryoshka } from './generate.ts';
import { solveMatryoshka } from './solve.ts';
import { type MatryoshkaPuzzle, type MatryoshkaSolution, SLUG } from './spec.ts';

export const matryoshkaLogic: GameLogic<MatryoshkaPuzzle, MatryoshkaSolution> = {
  slug: SLUG,
  needs: ['common'],
  generate: generateMatryoshka,
  solve: solveMatryoshka,
  accept: acceptMatryoshka,
};
