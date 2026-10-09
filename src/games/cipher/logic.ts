/** Cipher's game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { generateCipher } from './generate.ts';
import { acceptCipher, solveCipher } from './solve.ts';
import { type CipherPuzzle, type CipherSolution, SLUG } from './spec.ts';

export const cipherLogic: GameLogic<CipherPuzzle, CipherSolution> = {
  slug: SLUG,
  needs: ['lines'],
  generate: generateCipher,
  solve: solveCipher,
  accept: acceptCipher,
};
