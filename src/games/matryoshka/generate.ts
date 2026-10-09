/**
 * Matryoshka generator: cut a 2–3 letter seed from a random word, then keep it
 * only if its longest chain is an interesting length and it has more than one
 * way to start.
 */

import type { GenerateContext } from '../../core/game.ts';
import type { Rng } from '../../core/rng.ts';
import {
  MAX_CHAIN,
  MAX_SEED,
  MAX_SOURCE_LENGTH,
  type MatryoshkaPuzzle,
  type MatryoshkaSolution,
  MIN_CHAIN,
  MIN_FIRST_STEPS,
  MIN_SEED,
  MIN_SOURCE_LENGTH,
} from './spec.ts';

export function generateMatryoshka(rng: Rng, { dict }: GenerateContext): MatryoshkaPuzzle | null {
  const words = dict.ofLength(rng.int(MIN_SOURCE_LENGTH, MAX_SOURCE_LENGTH));
  if (words.length === 0) return null;
  const source = rng.pick(words);
  const size = rng.int(MIN_SEED, MAX_SEED);
  const start = rng.int(0, source.length - size);
  return { seed: source.slice(start, start + size) };
}

/** Difficulty bounds, and at least one longest chain must be made of everyday words. */
export function acceptMatryoshka(
  _puzzle: MatryoshkaPuzzle,
  solution: MatryoshkaSolution,
  ctx: GenerateContext,
) {
  const { common } = ctx;
  return (
    (!common || solution.chains.some((chain) => chain.every((w) => common.has(w)))) &&
    solution.best >= MIN_CHAIN &&
    solution.best <= MAX_CHAIN &&
    solution.firstSteps >= MIN_FIRST_STEPS
  );
}
