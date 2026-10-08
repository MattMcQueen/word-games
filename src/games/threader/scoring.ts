/**
 * Threader's player-facing rules: checking a guess, finding which letters of
 * a word make up the thread (for highlighting), scoring, and the words used
 * in results and share text. Pure functions, unit tested; ui.ts wires them up.
 */

import { bestWord } from '../../core/best-word.ts';
import type { Dictionary } from '../../core/dictionary.ts';
import type { GameResult } from '../../core/progress.ts';
import { scoreMeter } from '../../core/share.ts';
import { letters } from '../../core/text.ts';
import { basicWordProblem } from '../../core/validate.ts';
import {
  compareThreaded,
  type ThreaderPuzzle,
  type ThreaderSolution,
  threadInWords,
} from './spec.ts';

/** Why a guess can't be accepted, or null if it can. */
export function threadProblem(
  word: string,
  puzzle: ThreaderPuzzle,
  dict: Dictionary,
  found: readonly string[],
): string | null {
  const basic = basicWordProblem(word, dict, found);
  if (basic) return basic;
  if (threadPositions(word, puzzle.letters).length < puzzle.letters.length) {
    return `${word.toUpperCase()} doesn't have ${threadInWords(puzzle.letters)} in that order.`;
  }
  return null;
}

/**
 * Positions in `word` of the thread's letters, matched left to right as early
 * as possible. Shorter than the thread if the word doesn't contain it all.
 */
export function threadPositions(word: string, thread: string): number[] {
  const positions: number[] = [];
  for (let i = 0; i < word.length && positions.length < thread.length; i++) {
    if (word[i] === thread[positions.length]) positions.push(i);
  }
  return positions;
}

/** The player's shortest word, or null if none yet. */
export const shortestOf = (words: readonly string[]) => bestWord(words, compareThreaded);

export function resultFor(
  words: readonly string[],
  solution: ThreaderSolution,
  gaveUp: boolean,
): GameResult {
  const shortest = shortestOf(words);
  const perfect = shortest?.length === solution.bestLength;
  return {
    score: shortest?.length ?? 0,
    best: solution.bestLength,
    perfect,
    gaveUp: gaveUp && !perfect,
  };
}

/** One sentence comparing the player's shortest word with the best possible. */
export function describeOutcome(shortest: string | null, solution: ThreaderSolution): string {
  const target = letters(solution.bestLength);
  if (!shortest) return `You didn't find a word; the shortest possible was ${target}.`;
  if (shortest.length === solution.bestLength) {
    return `Your shortest word had ${letters(shortest.length)}: the best possible!`;
  }
  return `Your shortest word had ${letters(shortest.length)}; the shortest possible was ${target}.`;
}

/** Spoiler-free share lines: lengths and counts only, never the words. */
export function shareLines(
  words: readonly string[],
  solution: ThreaderSolution,
  perfect: boolean,
): string[] {
  const shortest = shortestOf(words)?.length ?? 0;
  const headline = perfect
    ? `⭐ ${letters(shortest)}, the shortest possible`
    : `Shortest: ${shortest ? letters(shortest) : 'none'} (best ${solution.bestLength})`;
  return [
    `🧵 ${headline}`,
    scoreMeter(shortest, solution.bestLength, true),
    `Words found: ${words.length}`,
  ];
}
