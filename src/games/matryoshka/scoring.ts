/**
 * Matryoshka's player-facing rules: checking the next word in a chain,
 * scoring the longest chain built, and the words used in results and share
 * text. Pure functions, unit tested; ui.ts wires them up.
 */

import type { Dictionary } from '../../core/dictionary.ts';
import type { GameResult } from '../../core/progress.ts';
import { scoreMeter } from '../../core/share.ts';
import { plural } from '../../core/text.ts';
import { basicWordProblem } from '../../core/validate.ts';
import { isOneLetterInsertion, type MatryoshkaSolution } from './spec.ts';

/** Why `word` can't follow `current` in the chain, or null if it can. */
export function nextProblem(word: string, current: string, dict: Dictionary): string | null {
  const basic = basicWordProblem(word, dict);
  if (basic) return basic;
  const C = current.toUpperCase();
  if (word.length !== current.length + 1) return `Add exactly one letter to ${C}.`;
  if (!isOneLetterInsertion(current, word)) {
    return `${word.toUpperCase()} isn't ${C} with one letter added.`;
  }
  return null;
}

/** "AT → CAT → SCAT" */
export const chainLabel = (words: readonly string[]) => words.join(' → ').toUpperCase();

export function resultFor(
  longest: readonly string[],
  solution: MatryoshkaSolution,
  gaveUp: boolean,
): GameResult {
  const perfect = longest.length >= solution.best;
  return { score: longest.length, best: solution.best, perfect, gaveUp: gaveUp && !perfect };
}

export function describeOutcome(longest: number, best: number): string {
  const target = plural(best, 'word');
  if (longest === 0) return `You didn't add a word; the longest possible chain was ${target}.`;
  if (longest >= best) return `Your chain had ${plural(longest, 'word')}: the longest possible!`;
  return `Your longest chain had ${plural(longest, 'word')}; the longest possible was ${target}.`;
}

/** Spoiler-free share lines: chain lengths only, never the words. */
export function shareLines(longest: number, best: number): string[] {
  const headline =
    longest >= best
      ? `⭐ Chain of ${longest}, the longest possible`
      : `Chain of ${longest} (best ${best})`;
  return [`🪆 ${headline}`, scoreMeter(longest, best)];
}
