/** Gutenberg Gap "solver": the missing word, looked up from the bank, since the puzzle doesn't carry it. */

import type { GenerateContext } from '../../core/game.ts';
import type { GutenbergGapPuzzle, GutenbergGapSolution } from './spec.ts';

export function solveGutenbergGap(
  puzzle: GutenbergGapPuzzle,
  ctx: GenerateContext,
): GutenbergGapSolution {
  const word = ctx.sentences?.entries[puzzle.entry]?.word;
  if (!word) throw new Error(`Sentence ${puzzle.entry} isn't in the bank`);
  return { word };
}
