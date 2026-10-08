/**
 * Matryoshka solver. The longest chain from a word is 1 + the longest chain
 * from any word made by inserting one letter into it, so a memoised depth-first
 * search finds it exactly. Each word has at most 26 × (length + 1) children,
 * and chains are short, so this takes milliseconds.
 */

import type { Dictionary } from '../../core/dictionary.ts';
import type { GenerateContext } from '../../core/game.ts';
import { ALPHABET } from '../../solvers/letters.ts';
import { EXAMPLE_CHAINS, type MatryoshkaPuzzle, type MatryoshkaSolution } from './spec.ts';

/** Every dictionary word made by inserting one letter into `word`. */
export function nextWords(word: string, dict: Dictionary): string[] {
  const found = new Set<string>();
  for (let i = 0; i <= word.length; i++) {
    for (const ch of ALPHABET) {
      const candidate = word.slice(0, i) + ch + word.slice(i);
      if (dict.has(candidate)) found.add(candidate);
    }
  }
  return [...found].sort();
}

/** Longest chain length from each word, memoised for one solve. */
function chainLengths(dict: Dictionary) {
  const memo = new Map<string, number>();
  const longest = (word: string): number => {
    const known = memo.get(word);
    if (known !== undefined) return known;
    let best = 0;
    for (const next of nextWords(word, dict)) best = Math.max(best, 1 + longest(next));
    memo.set(word, best);
    return best;
  };
  return longest;
}

export function solveMatryoshka(
  puzzle: MatryoshkaPuzzle,
  { dict }: GenerateContext,
): MatryoshkaSolution {
  const longest = chainLengths(dict);
  const best = longest(puzzle.seed);

  // Collect a few longest chains by always stepping to a child that still has
  // the most steps left, preferring chains that end in different words.
  const chains: string[][] = [];
  const endings = new Set<string>();
  const walk = (word: string, path: string[]) => {
    if (chains.length >= EXAMPLE_CHAINS) return;
    const left = longest(word);
    if (left === 0) {
      if (!endings.has(word)) {
        endings.add(word);
        chains.push(path);
      }
      return;
    }
    for (const next of nextWords(word, dict)) {
      if (longest(next) === left - 1) walk(next, [...path, next]);
    }
  };
  if (best > 0) walk(puzzle.seed, []);

  return { best, firstSteps: nextWords(puzzle.seed, dict).length, chains };
}
