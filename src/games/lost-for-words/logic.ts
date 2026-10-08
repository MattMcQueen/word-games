/** Lost for Words' game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { acceptLostForWords, generateLostForWords } from './generate.ts';
import { solveLostForWords } from './solve.ts';
import { type LostForWordsPuzzle, type LostForWordsSolution, SLUG } from './spec.ts';

export const lostForWordsLogic: GameLogic<LostForWordsPuzzle, LostForWordsSolution> = {
  slug: SLUG,
  needs: ['sentences'],
  generate: generateLostForWords,
  solve: solveLostForWords,
  accept: acceptLostForWords,
};
