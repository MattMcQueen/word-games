/**
 * Retitled's player-facing rules: matching a typed word to the title, scoring,
 * and the words used in results and share text. The word-by-word mechanics
 * are shared with Shelf Scramble (../title-words.ts). Pure functions, unit
 * tested; ui.ts wires them up.
 */

import { plural } from '../../core/text.ts';
import {
  freshTitleData,
  hintCount,
  placedWords,
  type TitleData,
  tally,
  titleResult,
  titleShareLines,
} from '../title-words.ts';
import { clueWords, type RetitledPuzzle, type RetitledSolution } from './spec.ts';

export type RetitledData = TitleData;

/** A fresh puzzle: only the words the clue keeps are in place. */
export const emptyData = (puzzle: RetitledPuzzle): RetitledData => freshTitleData(puzzle.given);

/**
 * What a typed word does: put one title word in place, put the whole rest of
 * the title in place (typed as one run of letters), or a message saying why not.
 */
export function matchGuess(
  guess: string,
  puzzle: RetitledPuzzle,
  solution: RetitledSolution,
  data: RetitledData,
): { words: number[] } | { problem: string } {
  const placed = placedWords(guess, solution.words, data);
  if (placed.length) return { words: placed };
  const G = guess.toUpperCase();
  if (solution.words.includes(guess)) return { problem: `${G} is already in place.` };
  if (clueWords(puzzle.clue).includes(guess)) {
    return { problem: `${G} is in the new title. Which word did it replace?` };
  }
  return { problem: `${G} isn't one of the title's words.` };
}

export const resultFor = (puzzle: RetitledPuzzle, data: RetitledData, gaveUp: boolean) =>
  titleResult(puzzle.given, data, gaveUp);

export function describeOutcome(puzzle: RetitledPuzzle, data: RetitledData): string {
  const { total, done } = tally(puzzle.given, data);
  const hints = hintCount(data);
  if (done === total) {
    return hints
      ? `You found the real title, with ${plural(hints, 'hint')}.`
      : 'You found the real title without a single hint!';
  }
  if (done === 0) return "You didn't find any of the real title.";
  return `You found ${done} of the ${plural(total, 'word')}.`;
}

/** Spoiler-free share lines: a square per word to find (🟩 unaided, 🟨 with a letter, ⬜ not found). */
export const shareLines = (puzzle: RetitledPuzzle, data: RetitledData) =>
  titleShareLines('📖', puzzle.given, data);
