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

/**
 * How the player did, in terms of the goal: the shortest word. "No word" means
 * none of their words had the thread in order, so say that.
 */
export function describeOutcome(
  shortest: string | null,
  solution: ThreaderSolution,
  thread: string,
): string {
  const target = letters(solution.bestLength);
  if (!shortest) {
    return `You didn't find a word with ${threadInWords(thread)} in order. The shortest has ${target}.`;
  }
  if (shortest.length === solution.bestLength) return `You found the shortest word: ${target}!`;
  return `You didn't find the shortest word. Yours had ${letters(shortest.length)}; the shortest has ${solution.bestLength}.`;
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
