/** Scoring and wording shared by the "longest word wins" games (Keyhop, Lockout). */

import { bestWord } from './best-word.ts';
import type { GameResult } from './progress.ts';
import { scoreMeter } from './share.ts';
import { letters } from './text.ts';

/** Longer words are better: positive if a beats b. */
export const longerWins = (a: string, b: string) => a.length - b.length;

export const longestOf = (words: readonly string[]) => bestWord(words, longerWins);

export function longestResult(
  words: readonly string[],
  bestLength: number,
  gaveUp: boolean,
): GameResult {
  const longest = longestOf(words)?.length ?? 0;
  const perfect = longest >= bestLength;
  return { score: longest, best: bestLength, perfect, gaveUp: gaveUp && !perfect };
}

/**
 * How the player did, in terms of the goal: the longest word. "No word" means
 * none of their words followed the day's rules, which `rule` describes
 * ("with J and none of the locked-out letters"), so say that.
 */
export function describeLongest(longest: string | null, bestLength: number, rule: string): string {
  const target = letters(bestLength);
  if (!longest) return `You didn't find a word ${rule}. The longest has ${target}.`;
  if (longest.length >= bestLength) return `You found the longest word: ${target}!`;
  return `You didn't find the longest word. Yours had ${letters(longest.length)}; the longest has ${bestLength}.`;
}

/** Spoiler-free share lines: lengths only, never the words. */
export function shareLongest(
  emoji: string,
  words: readonly string[],
  bestLength: number,
): string[] {
  const longest = longestOf(words)?.length ?? 0;
  const headline =
    longest >= bestLength
      ? `⭐ ${letters(longest)}, the longest possible`
      : `Longest: ${longest ? letters(longest) : 'none'} (best ${bestLength})`;
  return [`${emoji} ${headline}`, scoreMeter(longest, bestLength), `Words found: ${words.length}`];
}
