/**
 * Price Tag's player-facing rules: checking a guess, scoring the player's
 * words against the optimum, and the words used in results and share text.
 * Pure functions, so they're unit tested; ui.ts just wires them up.
 */

import type { Dictionary } from '../../core/dictionary.ts';
import type { GameResult } from '../../core/progress.ts';
import { scoreMeter } from '../../core/share.ts';
import { basicWordProblem } from '../../core/validate.ts';
import {
  compareScores,
  letters,
  type PriceTagPuzzle,
  type PriceTagSolution,
  type WordScore,
  wordCost,
} from './spec.ts';

export const pence = (n: number) => `${n}p`;

export type ScoredWord = WordScore & { word: string };

/** Why a guess can't be accepted, or null if it can. */
export function wordProblem(
  word: string,
  puzzle: PriceTagPuzzle,
  dict: Dictionary,
  found: readonly string[],
): string | null {
  const basic = basicWordProblem(word, dict, found);
  if (basic) return basic;
  const over = wordCost(word, puzzle.prices) - puzzle.budget;
  if (over > 0) {
    return `${word.toUpperCase()} costs ${pence(puzzle.budget + over)}, ${pence(over)} over budget.`;
  }
  return null;
}

/** The player's best word so far, by length then cost; null if none. */
export function bestOf(words: readonly string[], prices: readonly number[]): ScoredWord | null {
  let best: ScoredWord | null = null;
  for (const word of words) {
    const score = { word, length: word.length, cost: wordCost(word, prices) };
    if (!best || compareScores(score, best) > 0) best = score;
  }
  return best;
}

/** Score the player's words against the optimum. */
export function resultFor(
  words: readonly string[],
  puzzle: PriceTagPuzzle,
  solution: PriceTagSolution,
  gaveUp: boolean,
): GameResult {
  const best = bestOf(words, puzzle.prices);
  const perfect = best?.length === solution.bestLength && best.cost === solution.bestCost;
  return {
    score: best?.length ?? 0,
    best: solution.bestLength,
    perfect,
    gaveUp: gaveUp && !perfect,
  };
}

/** One sentence comparing the player's best with the optimum. */
export function describeOutcome(best: ScoredWord | null, solution: PriceTagSolution): string {
  const target = `${letters(solution.bestLength)} (${pence(solution.bestCost)})`;
  if (!best) return `You didn't find a word; the best possible was ${target}.`;
  if (best.length === solution.bestLength && best.cost === solution.bestCost) {
    return `You found ${letters(best.length)} for ${pence(best.cost)}: the best possible!`;
  }
  return `You found ${letters(best.length)} (${pence(best.cost)}); the best possible was ${target}.`;
}

/** Spoiler-free share lines: lengths and spend only, never the words. */
export function shareLines(
  best: ScoredWord | null,
  puzzle: PriceTagPuzzle,
  solution: PriceTagSolution,
  perfect: boolean,
): string[] {
  const length = best?.length ?? 0;
  const star = perfect ? '⭐ ' : '';
  return [
    `${star}${length}/${solution.bestLength} letters · ${pence(best?.cost ?? 0)} of ${pence(puzzle.budget)}`,
    scoreMeter(length, solution.bestLength),
  ];
}
