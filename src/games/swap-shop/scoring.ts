/**
 * Swap Shop's player-facing rules: checking a guess, scoring the pairs found,
 * and the words used in results and share text. Pure functions, unit tested;
 * ui.ts wires them up.
 */

import type { Dictionary } from '../../core/dictionary.ts';
import type { GameResult } from '../../core/progress.ts';
import { scoreMeter } from '../../core/share.ts';
import { plural } from '../../core/text.ts';
import { basicWordProblem } from '../../core/validate.ts';
import {
  familyHead,
  pairKey,
  pairLabel,
  type SwapShopPuzzle,
  type SwapShopSolution,
  swapLetters,
} from './spec.ts';

/** Why a guess can't be accepted, or null if it can. `found` holds pair keys. */
export function swapProblem(
  word: string,
  puzzle: SwapShopPuzzle,
  solution: SwapShopSolution,
  dict: Dictionary,
  found: readonly string[],
): string | null {
  const basic = basicWordProblem(word, dict);
  if (basic) return basic;
  if (puzzle.length !== null && word.length !== puzzle.length) {
    return `Today's words have ${puzzle.length} letters.`;
  }
  const [a = '', b = ''] = puzzle.letters;
  const W = word.toUpperCase();
  if (!word.includes(a) && !word.includes(b)) {
    return `${W} has no ${a.toUpperCase()} or ${b.toUpperCase()} to swap.`;
  }
  const swapped = swapLetters(word, a, b);
  if (!dict.has(swapped))
    return `${W} becomes ${swapped.toUpperCase()}, which isn't in the word list.`;
  const head = familyHead(pairKey(word, swapped), solution);
  if (found.includes(head)) return `You've already found ${pairLabel(head)}.`;
  return null;
}

export function resultFor(
  found: readonly string[],
  solution: SwapShopSolution,
  gaveUp: boolean,
): GameResult {
  const total = solution.pairs.length;
  const perfect = found.length >= total;
  return { score: found.length, best: total, perfect, gaveUp: gaveUp && !perfect };
}

export function describeOutcome(found: number, total: number, bonus = 0): string {
  const extra = bonus ? ` You also found ${plural(bonus, 'bonus pair')}.` : '';
  if (found >= total) return `You found all ${plural(total, 'pair')}!${extra}`;
  if (found === 0) return `You didn't find any of the ${plural(total, 'pair')}.${extra}`;
  return `You found ${found} of the ${plural(total, 'pair')}.${extra}`;
}

/** The pairs the player didn't find, in order. */
export const missedPairs = (found: readonly string[], solution: SwapShopSolution) =>
  solution.pairs.filter((key) => !found.includes(key));

/** Spoiler-free share lines: the swap and the count, never the words. */
export function shareLines(
  found: number,
  puzzle: SwapShopPuzzle,
  solution: SwapShopSolution,
  bonus = 0,
): string[] {
  const total = solution.pairs.length;
  const [a = '', b = ''] = puzzle.letters.toUpperCase();
  const star = found >= total ? '⭐ ' : '';
  const extra = bonus ? ` +${bonus} bonus` : '';
  return [`🔁 ${a} ↔ ${b} · ${star}${found}/${total} pairs${extra}`, scoreMeter(found, total)];
}
