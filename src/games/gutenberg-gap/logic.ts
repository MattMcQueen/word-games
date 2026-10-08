/** Gutenberg Gap's game logic, as used by the generator script and the browser fallback. */

import type { GameLogic } from '../../core/game.ts';
import { acceptGutenbergGap, generateGutenbergGap } from './generate.ts';
import { solveGutenbergGap } from './solve.ts';
import { type GutenbergGapPuzzle, type GutenbergGapSolution, SLUG } from './spec.ts';

export const gutenbergGapLogic: GameLogic<GutenbergGapPuzzle, GutenbergGapSolution> = {
  slug: SLUG,
  needsSentences: true,
  generate: generateGutenbergGap,
  solve: solveGutenbergGap,
  accept: acceptGutenbergGap,
};
