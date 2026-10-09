/**
 * Clean Sweep solver: the fewest dictionary words that use every letter of
 * the pool exactly once (an exact cover of a multiset).
 *
 * Iterative deepening: try 1 word, then 2, 3, … up to a limit. At each level
 *  - the next word must contain the lowest remaining letter (someone has to
 *    cover it), which keeps the search small and ordered;
 *  - a branch is abandoned when the remaining letters can't fit in the words left;
 *  - the last word is looked up directly as an anagram of what's left.
 * Sweeps found more than once (in a different order) are counted once.
 */

import { type Dictionary, everydayDictionary } from '../../core/dictionary.ts';
import type { GenerateContext } from '../../core/game.ts';
import { canSpell, letterCounts, subtractLetters } from '../../solvers/letters.ts';
import {
  type CleanSweepPuzzle,
  type CleanSweepSolution,
  EXAMPLE_SOLUTIONS,
  MAX_SOLUTIONS,
} from './spec.ts';

const A = 97;

/** The letters a count array holds, as a string: [1,0,2,…] → "acc…". */
function countsToLetters(counts: Uint8Array): string {
  let out = '';
  counts.forEach((n, i) => {
    out += String.fromCharCode(A + i).repeat(n);
  });
  return out;
}

const total = (counts: Uint8Array) => counts.reduce((sum, n) => sum + n, 0);

interface Candidate {
  word: string;
  counts: Uint8Array;
}

/**
 * Find the fewest words that sweep `letters`, trying up to `maxWords`.
 * Returns min 0 if it can't be done within the limit.
 */
export function sweep(letters: string, dict: Dictionary, maxWords: number): CleanSweepSolution {
  const pool = letterCounts(letters);
  const candidates: Candidate[] = dict.words
    .filter((w) => w.length <= letters.length && canSpell(w, pool))
    .map((word) => ({ word, counts: letterCounts(word) }));
  const longest = candidates.reduce((max, c) => Math.max(max, c.word.length), 0);

  for (let depth = 1; depth <= maxWords; depth++) {
    const found = new Set<string>();
    const examples: string[][] = [];

    const search = (remaining: Uint8Array, wordsLeft: number, chosen: string[]) => {
      if (found.size > MAX_SOLUTIONS) return;
      const left = total(remaining);
      if (left > longest * wordsLeft) return;

      if (wordsLeft === 1) {
        for (const word of dict.anagramsOf(countsToLetters(remaining))) record([...chosen, word]);
        return;
      }
      const lowest = remaining.findIndex((n) => n > 0);
      for (const c of candidates) {
        if (c.counts[lowest] === 0 || !canSpell(c.word, remaining)) continue;
        search(subtractLetters(remaining, c.word), wordsLeft - 1, [...chosen, c.word]);
      }
    };

    const record = (words: string[]) => {
      const sorted = [...words].sort();
      const key = sorted.join(' ');
      if (found.has(key)) return;
      found.add(key);
      if (examples.length < EXAMPLE_SOLUTIONS) examples.push(sorted);
    };

    search(pool, depth, []);
    if (found.size > 0) return { min: depth, solutions: found.size, examples };
  }
  return { min: 0, solutions: 0, examples: [] };
}

export function solveCleanSweep(
  puzzle: CleanSweepPuzzle,
  { dict, common }: GenerateContext,
  maxWords = 4,
): CleanSweepSolution {
  const best = sweep(puzzle.letters, dict, maxWords);
  if (!common || best.min === 0) return best;
  // Show everyday sweeps when they're as short as the best, so the examples
  // are words most players know.
  const everyday = sweep(puzzle.letters, everydayDictionary(dict, common), best.min);
  return everyday.min === best.min ? { ...best, examples: everyday.examples } : best;
}
