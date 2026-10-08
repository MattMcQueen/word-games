/**
 * Gutenberg Gap's player-facing rules: which letters are showing, checking a
 * guess, when the game's over, scoring, and the words used in results and
 * share text. Pure functions, unit tested; ui.ts wires them up.
 */

import type { Dictionary } from '../../core/dictionary.ts';
import type { GameResult } from '../../core/progress.ts';
import { plural } from '../../core/text.ts';
import { basicWordProblem } from '../../core/validate.ts';
import type { GutenbergGapPuzzle } from './spec.ts';

/** Wrong guesses so far. */
export const wrongCount = (guesses: readonly string[], answer: string) =>
  guesses.filter((g) => g !== answer).length;

/** Positions of the letters revealed after `wrong` wrong guesses. */
export const revealed = (puzzle: GutenbergGapPuzzle, wrong: number) =>
  new Set(puzzle.reveal.slice(0, wrong));

/** The gap as letters and blanks, e.g. ['', 'a', '', '', 'e'] for _A__E. */
export function pattern(answer: string, shown: ReadonlySet<number>): string[] {
  return [...answer].map((ch, i) => (shown.has(i) ? ch : ''));
}

/** Why a guess can't be accepted, or null if it can. */
export function guessProblem(
  guess: string,
  puzzle: GutenbergGapPuzzle,
  answer: string,
  dict: Dictionary,
  guesses: readonly string[],
): string | null {
  if (guess.length !== puzzle.length) return `The missing word has ${puzzle.length} letters.`;
  const basic = basicWordProblem(guess, dict, guesses);
  if (basic) return basic.replace("You've already found", "You've already tried");
  const shown = revealed(puzzle, wrongCount(guesses, answer));
  for (const i of shown) {
    if (guess[i] !== answer[i]) return `${guess.toUpperCase()} doesn't fit the letters shown.`;
  }
  return null;
}

const solved = (guesses: readonly string[], answer: string) => guesses.includes(answer);

/** Over when it's guessed, or every letter has been revealed. */
export const isOver = (guesses: readonly string[], answer: string) =>
  solved(guesses, answer) || wrongCount(guesses, answer) >= answer.length;

export function resultFor(guesses: readonly string[], answer: string, gaveUp: boolean): GameResult {
  const won = solved(guesses, answer);
  const perfect = won && guesses.length === 1;
  return { score: won ? guesses.length : 0, best: 1, perfect, gaveUp: gaveUp && !won };
}

export function describeOutcome(guesses: readonly string[], answer: string): string {
  if (!solved(guesses, answer)) return `The missing word was ${answer.toUpperCase()}.`;
  if (guesses.length === 1) return 'You got it in one!';
  return `You got it in ${plural(guesses.length, 'guess', 'guesses')}.`;
}

/** Spoiler-free share lines: a square per guess (⬛ wrong, 🟩 right), never the word. */
export function shareLines(guesses: readonly string[], answer: string): string[] {
  const squares = guesses.map((g) => (g === answer ? '🟩' : '⬛')).join('');
  const headline = solved(guesses, answer)
    ? `${guesses.length === 1 ? '⭐ ' : ''}Got it in ${guesses.length}/${answer.length}`
    : `Missed it (${answer.length} letters)`;
  return [`📖 ${headline}`, squares || '—'];
}
