/**
 * Guessing a book's title word by word, shared by Shelf Scramble and Retitled:
 * the player's progress, matching a typed guess, letter hints, scoring and
 * share squares. Each game decides which words start in place (`given`) and
 * words its own messages. Pure functions, unit tested through both games.
 */

import type { GameResult } from '../core/progress.ts';
import { plural } from '../core/text.ts';

/** A title's words, lowercase: "Pride and Prejudice" → pride, and, prejudice. */
export const titleWords = (title: string) => title.toLowerCase().split(' ');

export interface TitleData {
  /** Which title words are in place (given words start in place). */
  found: boolean[];
  /** Letters revealed for each word. */
  revealed: number[];
  /** Whether the author has been shown. */
  author: boolean;
}

/** A fresh puzzle: only the given words are in place. */
export const freshTitleData = (given: readonly boolean[]): TitleData => ({
  found: [...given],
  revealed: given.map(() => 0),
  author: false,
});

/**
 * The words a typed guess puts in place: one word still to find, or all of
 * them when the title is typed as one run of letters (with or without the
 * words already in place). Empty if it matches nothing.
 */
export function placedWords(guess: string, words: readonly string[], data: TitleData): number[] {
  const open = words.flatMap((_w, i) => (data.found[i] ? [] : [i]));
  const rest = open.map((i) => words[i]).join('');
  if (open.length > 1 && (guess === rest || guess === words.join(''))) return open;
  const exact = open.find((i) => words[i] === guess);
  return exact === undefined ? [] : [exact];
}

/** Letters that can be revealed in a word: all but one. */
const maxReveal = (word: string) => word.length - 1;

/** The word a "Reveal a letter" hint goes to: the first one still to find with letters left to show. */
export function nextToReveal(words: readonly string[], data: TitleData): number {
  return words.findIndex((w, i) => !data.found[i] && (data.revealed[i] ?? 0) < maxReveal(w));
}

export const hintCount = (data: TitleData) =>
  data.revealed.reduce((a, b) => a + b, 0) + (data.author ? 1 : 0);

export const allFound = (data: TitleData) => data.found.every(Boolean);

/** The words the player had to find (not given), and how many of them are done. */
export function tally(given: readonly boolean[], data: TitleData) {
  const toFind = given.flatMap((g, i) => (g ? [] : [i]));
  return { total: toFind.length, done: toFind.filter((i) => data.found[i]).length };
}

export function titleResult(
  given: readonly boolean[],
  data: TitleData,
  gaveUp: boolean,
): GameResult {
  const { total, done } = tally(given, data);
  const all = done === total;
  return {
    score: done,
    best: total,
    perfect: all && hintCount(data) === 0,
    gaveUp: gaveUp && !all,
  };
}

/**
 * Spoiler-free share lines: a headline after the game's emoji, then a square
 * per word to find (🟩 unaided, 🟨 with a letter, ⬜ not found).
 */
export function titleShareLines(
  emoji: string,
  given: readonly boolean[],
  data: TitleData,
): string[] {
  const squares = given
    .flatMap((g, i) => {
      if (g) return [];
      if (!data.found[i]) return ['⬜'];
      return [(data.revealed[i] ?? 0) > 0 ? '🟨' : '🟩'];
    })
    .join('');
  const { total, done } = tally(given, data);
  const hints = hintCount(data);
  const headline =
    done === total
      ? `${hints ? '' : '⭐ '}Solved${hints ? ` with ${plural(hints, 'hint')}` : ', no hints'}`
      : `${done}/${total} words`;
  return [`${emoji} ${headline}`, squares];
}
