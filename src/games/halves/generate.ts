/**
 * Halves generator: choose six everyday compound words (CUP + BOARD) whose
 * twelve halves are all different, shuffle the halves, and keep the set only
 * if there's exactly one way to pair them all. The compounds come from the
 * same index of everyday word splits that Hinge uses.
 */

import type { Dictionary } from '../../core/dictionary.ts';
import type { GenerateContext } from '../../core/game.ts';
import type { Rng } from '../../core/rng.ts';
import { type HingeIndex, hingeIndex } from '../hinge/hinge-index.ts';
import { pairings } from './solve.ts';
import {
  type HalvesPuzzle,
  type HalvesSolution,
  MAX_HALF,
  MIN_HALF,
  WORDS_PER_DAY,
} from './spec.ts';

/**
 * Words that are really another word plus an ending: STAB + BED = STABBED
 * (a doubled letter), NOBLE + MEN = NOBLEMEN, DRAGON + FLIES = DRAGONFLIES.
 * They make poor answers, so they're left out.
 */
function isInflectedCompound(word: string, dict: Dictionary): boolean {
  const doubled = ['ed', 'ing', 'er', 'est', 'en'].some((suffix) => {
    if (!word.endsWith(suffix)) return false;
    const stem = word.slice(0, -suffix.length - 1);
    return word.at(-suffix.length - 1) === stem.at(-1) && dict.has(stem);
  });
  const plural =
    (word.endsWith('men') && dict.has(`${word.slice(0, -3)}man`)) ||
    (word.endsWith('ies') && dict.has(`${word.slice(0, -3)}y`));
  return doubled || plural;
}

const compoundsCache = new WeakMap<HingeIndex, [string, string][]>();

/** Every everyday compound with both halves 3–6 letters, alphabetically. */
function compounds(index: HingeIndex, dict: Dictionary): [string, string][] {
  let list = compoundsCache.get(index);
  if (!list) {
    list = [];
    for (const [tail, heads] of index.before) {
      if (tail.length > MAX_HALF) continue;
      for (const head of heads) {
        if (head.length > MAX_HALF || head.length < MIN_HALF) continue;
        if (!isInflectedCompound(head + tail, dict)) list.push([head, tail]);
      }
    }
    list.sort((x, y) => (x[0] + x[1]).localeCompare(y[0] + y[1]));
    compoundsCache.set(index, list);
  }
  return list;
}

export function generateHalves(rng: Rng, ctx: GenerateContext): HalvesPuzzle | null {
  if (!ctx.common) throw new Error('Halves needs the common words');
  const pool = compounds(hingeIndex(ctx.dict, ctx.common), ctx.dict);
  const halves = new Set<string>();
  for (let t = 0; t < 200 && halves.size < WORDS_PER_DAY * 2; t++) {
    const [a, b] = rng.pick(pool);
    if (halves.has(a) || halves.has(b) || a === b) continue;
    halves.add(a);
    halves.add(b);
  }
  if (halves.size < WORDS_PER_DAY * 2) return null;
  const puzzle = { halves: rng.shuffle([...halves]) };
  // Only one way to pair every half, so the answer is certain.
  return pairings(puzzle.halves, ctx.dict, 2).length === 1 ? puzzle : null;
}

export function acceptHalves(_puzzle: HalvesPuzzle, solution: HalvesSolution): boolean {
  return solution.words.length === WORDS_PER_DAY;
}
