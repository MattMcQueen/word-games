/**
 * Shelf Scramble's player-facing rules: matching a typed word to the title,
 * hints, scoring, and the words used in results and share text. The word-by-
 * word mechanics are shared with Retitled (../title-words.ts); this adds the
 * anagram messages. Pure functions, unit tested; ui.ts wires them up.
 */

import type { GameResult } from '../../core/progress.ts';
import { plural } from '../../core/text.ts';
import { sortedLetters } from '../../solvers/letters.ts';
import {
  freshTitleData,
  hintCount,
  placedWords,
  type TitleData,
  tally,
  titleResult,
  titleShareLines,
} from '../title-words.ts';
import { isGiven, type ShelfScramblePuzzle, type ShelfScrambleSolution } from './spec.ts';

export type ShelfScrambleData = TitleData;
export { allFound, hintCount } from '../title-words.ts';

/** Short words (A, OF, IN…) start in place. */
const givenWords = (solution: ShelfScrambleSolution) => solution.words.map(isGiven);

/** A fresh puzzle: only the short words are in place. */
export const emptyData = (puzzle: ShelfScramblePuzzle): ShelfScrambleData =>
  freshTitleData(puzzle.tiles.map(isGiven));

/**
 * What a typed word does: put one title word in place, put the whole rest of
 * the title in place (typed as one run of letters), or a message saying why not.
 */
export function matchGuess(
  guess: string,
  solution: ShelfScrambleSolution,
  data: ShelfScrambleData,
): { words: number[] } | { problem: string } {
  const placed = placedWords(guess, solution.words, data);
  if (placed.length) return { words: placed };
  const G = guess.toUpperCase();
  if (solution.words.includes(guess)) return { problem: `${G} is already in place.` };
  const key = sortedLetters(guess);
  const open = solution.words.filter((_w, i) => !data.found[i]);
  if (open.some((w) => sortedLetters(w) === key)) {
    return { problem: `${G} uses the right letters, but it isn't the word.` };
  }
  return { problem: `${G} doesn't unscramble any word in the title.` };
}

export const resultFor = (
  solution: ShelfScrambleSolution,
  data: ShelfScrambleData,
  gaveUp: boolean,
): GameResult => titleResult(givenWords(solution), data, gaveUp);

export function describeOutcome(solution: ShelfScrambleSolution, data: ShelfScrambleData): string {
  const { total, done } = tally(givenWords(solution), data);
  const hints = hintCount(data);
  if (done === total) {
    return hints
      ? `You put the title back together, with ${plural(hints, 'hint')}.`
      : 'You put the title back together without a single hint!';
  }
  if (done === 0) return "You didn't unscramble any of the title.";
  return `You unscrambled ${done} of the ${plural(total, 'word')}.`;
}

/** Spoiler-free share lines: a square per word to unscramble (🟩 unaided, 🟨 with a letter, ⬜ not done). */
export const shareLines = (solution: ShelfScrambleSolution, data: ShelfScrambleData) =>
  titleShareLines('📚', givenWords(solution), data);
