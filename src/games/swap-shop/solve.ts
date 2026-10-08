/**
 * Swap Shop solver: every word whose swapped twin is also a word, as pairs,
 * with inflected pairs folded into their family. BATS ↔ BETS is part of
 * BAT ↔ BET, and JAPING ↔ VAPING part of JAPE ↔ VAPE, so the counter counts
 * ideas rather than plurals.
 */

import type { GenerateContext } from '../../core/game.ts';
import { pairKey, type SwapShopPuzzle, type SwapShopSolution, swapLetters } from './spec.ts';

/** Endings that make one pair an inflection of another. */
const SUFFIXES = ['s', 'es', 'd', 'ed', 'ing', 'er', 'ers', 'est', 'ly'];

/** The pair this one is an inflection of, if that pair exists: bats/bets → bat/bet. */
function stemPair(key: string, all: ReadonlySet<string>): string | null {
  const [x = '', y = ''] = key.split('/');
  for (const suffix of SUFFIXES) {
    if (!x.endsWith(suffix) || !y.endsWith(suffix)) continue;
    // JAPING → JAP or JAPE: try the stem with and without a final E.
    for (const extra of ['', 'e']) {
      const sx = x.slice(0, -suffix.length) + extra;
      const sy = y.slice(0, -suffix.length) + extra;
      if (sx.length < 3 || sy.length < 3) continue;
      const stem = pairKey(sx, sy);
      if (all.has(stem)) return stem;
    }
  }
  return null;
}

/** The family a pair belongs to: its shortest uninflected form. */
function familyOf(key: string, all: ReadonlySet<string>): string {
  let base = key;
  for (let stem = stemPair(base, all); stem; stem = stemPair(base, all)) base = stem;
  return base;
}

export function solveSwapShop(puzzle: SwapShopPuzzle, { dict }: GenerateContext): SwapShopSolution {
  const [a = '', b = ''] = puzzle.letters;
  const words = puzzle.length === null ? dict.words : dict.ofLength(puzzle.length);
  const all = new Set<string>();
  for (const word of words) {
    if (!word.includes(a) && !word.includes(b)) continue;
    const swapped = swapLetters(word, a, b);
    // Both words of a pair are in the list; count the pair once, from its first word.
    if (word < swapped && dict.has(swapped)) all.add(pairKey(word, swapped));
  }

  const also: Record<string, string[]> = {};
  const heads = new Set<string>();
  for (const key of [...all].sort()) {
    const family = familyOf(key, all);
    heads.add(family);
    if (family === key) continue;
    also[family] ??= [];
    also[family].push(key);
  }
  return { pairs: [...heads].sort(), also };
}
