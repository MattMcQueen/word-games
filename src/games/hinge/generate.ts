/**
 * Hinge generator. The good hinge words are shuffled once with a fixed seed,
 * and each day takes its five from its own window of that order, so a hinge
 * doesn't come back for months. For each hinge, the day's random numbers pick
 * an everyday word to go before it and one to go after; a pair is kept only if
 * no other word in the whole dictionary fits it, so every pair has exactly one
 * answer.
 */

import type { GenerateContext } from '../../core/game.ts';
import { createRng, type Rng } from '../../core/rng.ts';
import { type HingeIndex, hingeIndex } from './hinge-index.ts';
import { hingesFor } from './solve.ts';
import {
  type HingePair,
  type HingePuzzle,
  type HingeSolution,
  ORDER_SEED,
  PAIRS_PER_DAY,
} from './spec.ts';

/** Hinges in each day's window (a few spare, in case one has no pair with a unique answer). */
const WINDOW = 8;
/** Random pairs to try for each hinge. */
const PAIR_TRIES = 12;

const orders = new WeakMap<HingeIndex, string[]>();

function hingeOrder(index: HingeIndex): string[] {
  let order = orders.get(index);
  if (!order) {
    order = createRng(ORDER_SEED).shuffle(index.hinges);
    orders.set(index, order);
  }
  return order;
}

export function generateHinge(rng: Rng, ctx: GenerateContext): HingePuzzle | null {
  if (!ctx.common) throw new Error('Hinge needs the common words');
  const index = hingeIndex(ctx.dict, ctx.common);
  const order = hingeOrder(index);
  const n = order.length;
  const start = (((ctx.dayIndex * WINDOW) % n) + n) % n;
  const used = new Set<string>();
  const pairs: HingePair[] = [];

  // Normally the day's own window is enough; carry on past it only if it isn't.
  for (let step = 0; step < n && pairs.length < PAIRS_PER_DAY; step++) {
    const hinge = order[(start + step) % n] as string;
    if (used.has(hinge)) continue;
    for (let t = 0; t < PAIR_TRIES; t++) {
      const left = rng.pick(index.before.get(hinge) ?? []);
      const right = rng.pick(index.after.get(hinge) ?? []);
      if (used.has(left) || used.has(right) || left === right) continue;
      const pair = { left, right, length: hinge.length };
      const answers = hingesFor(pair, ctx.dict);
      if (answers.length !== 1 || answers[0] !== hinge) continue;
      for (const w of [hinge, left, right]) used.add(w);
      pairs.push(pair);
      break;
    }
  }
  if (pairs.length < PAIRS_PER_DAY) return null;
  pairs.sort((a, b) => a.length - b.length || a.left.localeCompare(b.left));
  return { pairs };
}

export function acceptHinge(puzzle: HingePuzzle, solution: HingeSolution): boolean {
  return (
    puzzle.pairs.length === PAIRS_PER_DAY &&
    solution.answers.every((answer, i) => answer.length === puzzle.pairs[i]?.length)
  );
}
