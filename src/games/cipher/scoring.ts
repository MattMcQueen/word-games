/**
 * Cipher's player-facing rules: placing and clearing letters, hints, checking
 * the code, scoring, and the words used in results and share text. Pure
 * functions, unit tested; ui.ts wires them up.
 */

import type { GameResult } from '../../core/progress.ts';
import { plural } from '../../core/text.ts';
import { type CipherPuzzle, type CipherSolution, codeLetters } from './spec.ts';

export interface CipherData {
  /** The player's letter for each code letter. Each letter stands for only one code letter. */
  guesses: Record<string, string>;
  /** Code letters given away by hints, in the order they were given. */
  revealed: string[];
}

export const emptyData = (): CipherData => ({ guesses: {}, revealed: [] });

/** The code letter the player has given `letter` to, if any. */
const holderOf = (data: CipherData, letter: string) =>
  Object.keys(data.guesses).find((code) => data.guesses[code] === letter);

/**
 * Say that `code` stands for `letter`. A letter can only stand for one code
 * letter, so it moves from wherever it was. Letters given by hints stay put.
 */
export function placeLetter(
  data: CipherData,
  code: string,
  letter: string,
): { data: CipherData } | { problem: string } {
  if (data.revealed.includes(code)) {
    return { problem: `${code.toUpperCase()} was given away, so it can't change.` };
  }
  const holder = holderOf(data, letter);
  if (holder && data.revealed.includes(holder)) {
    return { problem: `${letter.toUpperCase()} was given away for ${holder.toUpperCase()}.` };
  }
  const guesses = { ...data.guesses };
  if (holder) delete guesses[holder];
  guesses[code] = letter;
  return { data: { ...data, guesses } };
}

/** Take the player's letter off `code` (unless a hint gave it). */
export function clearLetter(data: CipherData, code: string): CipherData {
  if (data.revealed.includes(code) || !(code in data.guesses)) return data;
  const guesses = { ...data.guesses };
  delete guesses[code];
  return { ...data, guesses };
}

/** How many of the code letters have a letter placed. */
export const placedCount = (puzzle: CipherPuzzle, data: CipherData) =>
  codeLetters(puzzle.coded).filter((code) => data.guesses[code]).length;

/** How many placed letters are wrong. */
export const wrongCount = (puzzle: CipherPuzzle, solution: CipherSolution, data: CipherData) =>
  codeLetters(puzzle.coded).filter(
    (code) => data.guesses[code] && data.guesses[code] !== solution.key[code],
  ).length;

export const isCracked = (puzzle: CipherPuzzle, solution: CipherSolution, data: CipherData) =>
  codeLetters(puzzle.coded).every((code) => data.guesses[code] === solution.key[code]);

/**
 * The code letter a hint gives away: the chosen one, unless it's already
 * right; otherwise the first one (in reading order) that isn't. Null once
 * every letter is right.
 */
export function hintTarget(
  puzzle: CipherPuzzle,
  solution: CipherSolution,
  data: CipherData,
  chosen: string | null,
): string | null {
  const right = (code: string) => data.guesses[code] === solution.key[code];
  if (chosen && !right(chosen)) return chosen;
  return codeLetters(puzzle.coded).find((code) => !right(code)) ?? null;
}

/** Give away the real letter for `code`, moving it from any other code letter. */
export function revealLetter(data: CipherData, solution: CipherSolution, code: string): CipherData {
  const letter = solution.key[code] as string;
  const guesses = { ...data.guesses };
  const holder = holderOf(data, letter);
  if (holder) delete guesses[holder];
  guesses[code] = letter;
  return { guesses, revealed: [...data.revealed, code] };
}

/** Code letters the player got right without a hint. */
const ownRight = (puzzle: CipherPuzzle, solution: CipherSolution, data: CipherData) =>
  codeLetters(puzzle.coded).filter(
    (code) => !data.revealed.includes(code) && data.guesses[code] === solution.key[code],
  );

export function resultFor(
  puzzle: CipherPuzzle,
  solution: CipherSolution,
  data: CipherData,
  gaveUp: boolean,
): GameResult {
  const cracked = isCracked(puzzle, solution, data);
  return {
    score: ownRight(puzzle, solution, data).length,
    best: codeLetters(puzzle.coded).length,
    perfect: cracked && data.revealed.length === 0,
    gaveUp: gaveUp && !cracked,
  };
}

export function describeOutcome(
  puzzle: CipherPuzzle,
  solution: CipherSolution,
  data: CipherData,
): string {
  const hints = data.revealed.length;
  if (isCracked(puzzle, solution, data)) {
    return hints
      ? `You cracked the code, with ${plural(hints, 'hint')}.`
      : 'You cracked the code without a single hint!';
  }
  const right = ownRight(puzzle, solution, data).length;
  if (right === 0) return "You didn't crack any of the code.";
  return `You had ${right} of the ${codeLetters(puzzle.coded).length} letters right.`;
}

/**
 * Spoiler-free share lines: a square per code letter in reading order
 * (🟩 cracked, 🟨 given by a hint, ⬜ not cracked).
 */
export function shareLines(
  puzzle: CipherPuzzle,
  solution: CipherSolution,
  data: CipherData,
): string[] {
  const codes = codeLetters(puzzle.coded);
  const squares = codes
    .map((code) => {
      if (data.revealed.includes(code)) return '🟨';
      return data.guesses[code] === solution.key[code] ? '🟩' : '⬜';
    })
    .join('');
  const hints = data.revealed.length;
  const headline = isCracked(puzzle, solution, data)
    ? `${hints ? '' : '⭐ '}Cracked${hints ? ` with ${plural(hints, 'hint')}` : ', no hints'}`
    : `${ownRight(puzzle, solution, data).length}/${codes.length} letters`;
  return [`🔐 ${headline}`, squares];
}
