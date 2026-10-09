/**
 * Halves solver: every way to pair all twelve halves into dictionary words
 * (either way round). A small depth-first search: the first unpaired half must
 * join with one of the others, so try each and carry on. Counting stops at
 * `limit`, since the generator only needs to know whether there's exactly one.
 */

import type { Dictionary } from '../../core/dictionary.ts';
import type { GenerateContext } from '../../core/game.ts';
import type { HalvesPuzzle, HalvesSolution } from './spec.ts';

export function pairings(
  halves: readonly string[],
  dict: Dictionary,
  limit = 2,
): [string, string][][] {
  const found: [string, string][][] = [];
  const used = halves.map(() => false);
  const chosen: [string, string][] = [];

  const search = () => {
    if (found.length >= limit) return;
    const i = used.indexOf(false);
    if (i === -1) {
      found.push([...chosen]);
      return;
    }
    used[i] = true;
    for (let j = i + 1; j < halves.length; j++) {
      if (used[j]) continue;
      const a = halves[i] as string;
      const b = halves[j] as string;
      for (const pair of [
        [a, b],
        [b, a],
      ] as [string, string][]) {
        if (!dict.has(pair[0] + pair[1])) continue;
        used[j] = true;
        chosen.push(pair);
        search();
        chosen.pop();
        used[j] = false;
      }
    }
    used[i] = false;
  };

  search();
  return found;
}

export function solveHalves(puzzle: HalvesPuzzle, { dict }: GenerateContext): HalvesSolution {
  return { words: pairings(puzzle.halves, dict, 1)[0] ?? [] };
}
