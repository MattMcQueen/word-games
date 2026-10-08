/** Hinge solver: every word in the dictionary that joins each pair (the generator keeps pairs with exactly one). */

import type { Dictionary } from '../../core/dictionary.ts';
import type { GenerateContext } from '../../core/game.ts';
import { fits, type HingePair, type HingePuzzle, type HingeSolution } from './spec.ts';

/** Every word of the right length that hinges the pair. */
export function hingesFor(pair: HingePair, dict: Dictionary): string[] {
  return dict.ofLength(pair.length).filter((word) => fits(word, pair, dict));
}

export function solveHinge(puzzle: HingePuzzle, { dict }: GenerateContext): HingeSolution {
  return { answers: puzzle.pairs.map((pair) => hingesFor(pair, dict)[0] ?? '') };
}
