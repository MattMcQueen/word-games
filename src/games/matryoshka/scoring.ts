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

export function resultFor(
  longest: readonly string[],
  solution: MatryoshkaSolution,
  gaveUp: boolean,
): GameResult {
  const perfect = longest.length >= solution.best;
  return { score: longest.length, best: solution.best, perfect, gaveUp: gaveUp && !perfect };
}

/** How the player did, in terms of the goal: the longest chain. */
export function describeOutcome(longest: number, best: number, seed: string): string {
  const target = plural(best, 'word');
  if (longest === 0) {
    return `You didn't add a word to ${seed.toUpperCase()}. The longest chain has ${target}.`;
  }
  if (longest >= best) return `You built the longest chain: ${target}!`;
  return `You didn't build the longest chain. Yours had ${plural(longest, 'word')}; the longest has ${best}.`;
}

/** Spoiler-free share lines: chain lengths only, never the words. */
export function shareLines(longest: number, best: number): string[] {
  const headline =
    longest >= best
      ? `⭐ Chain of ${longest}, the longest possible`
      : `Chain of ${longest} (best ${best})`;
  return [`🪆 ${headline}`, scoreMeter(longest, best)];
}
