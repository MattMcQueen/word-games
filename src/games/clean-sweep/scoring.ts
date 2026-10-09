/**
 * Clean Sweep's player-facing rules: what letters are left, checking a word
 * against them, scoring, and the words used in results and share text. Pure
 * functions, unit tested; ui.ts wires them up.
 */

import type { Dictionary } from '../../core/dictionary.ts';
import type { GameResult } from '../../core/progress.ts';
import { scoreMeter } from '../../core/share.ts';
import { plural } from '../../core/text.ts';
import { basicWordProblem } from '../../core/validate.ts';
import { canSpell, letterCounts, subtractLetters } from '../../solvers/letters.ts';
import type { CleanSweepSolution } from './spec.ts';

/** Letter counts still unused after the words placed so far. */
export function remainingCounts(letters: string, words: readonly string[]): Uint8Array {
  return words.reduce((left, w) => subtractLetters(left, w), letterCounts(letters));
}

/** Why `word` can't be swept from what's left, or null if it can. */
export function sweepProblem(word: string, left: Uint8Array, dict: Dictionary): string | null {
  const basic = basicWordProblem(word, dict);
  if (basic) return basic;
  if (!canSpell(word, left)) return `There aren't the letters left for ${word.toUpperCase()}.`;
  return null;
}

/** The player's best complete sweep is the one with fewest words; null if none yet. */
export function betterSweep(current: readonly string[], best: readonly string[] | null) {
  return best === null || current.length < best.length;
}

export function resultFor(
  best: readonly string[] | null,
  solution: CleanSweepSolution,
  gaveUp: boolean,
): GameResult {
  const used = best?.length ?? 0;
  const perfect = best !== null && used <= solution.min;
  return { score: used, best: solution.min, perfect, gaveUp: gaveUp && !perfect };
}

export function describeOutcome(best: readonly string[] | null, min: number): string {
  const target = plural(min, 'word');
  if (best === null) return `You didn't sweep every letter. It can be done in ${target}.`;
  if (best.length <= min) return `You swept every letter in the fewest words: ${target}!`;
  return `You swept every letter in ${plural(best.length, 'word')}, but it can be done in ${min}.`;
}

/** Spoiler-free share lines: word counts only, never the words. */
export function shareLines(best: readonly string[] | null, min: number, hints = 0): string[] {
  if (best === null) return [`🧹 Not swept (best ${min})`, scoreMeter(0, min, true)];
  const used = hints ? ` · ${plural(hints, 'hint')}` : '';
  const headline =
    best.length <= min
      ? `${hints ? '' : '⭐ '}Swept in ${best.length}, the fewest possible${used}`
      : `Swept in ${plural(best.length, 'word')} (best ${min})${used}`;
  return [`🧹 ${headline}`, scoreMeter(best.length, min, true)];
}
