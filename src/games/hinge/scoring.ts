/**
 * Hinge's player-facing rules: matching a guess to a pair, hints, scoring,
 * and the words used in results and share text. Pure functions, unit tested;
 * ui.ts wires them up.
 */

import type { Dictionary } from '../../core/dictionary.ts';
import type { GameResult } from '../../core/progress.ts';
import { plural } from '../../core/text.ts';
import { basicWordProblem } from '../../core/validate.ts';
import { fits, type HingePuzzle } from './spec.ts';

export interface HingeData {
  /** The hinge found for each pair, or '' while unsolved. */
  found: string[];
  /** Letters revealed for each pair. */
  hints: number[];
}

export const emptyData = (puzzle: HingePuzzle): HingeData => ({
  found: puzzle.pairs.map(() => ''),
  hints: puzzle.pairs.map(() => 0),
});

/**
 * Which unsolved pair a guess hinges, or a message saying why it doesn't.
 * Any word that fits counts, though each pair has only one.
 */
export function matchGuess(
  guess: string,
  puzzle: HingePuzzle,
  data: HingeData,
  dict: Dictionary,
): { pair: number } | { problem: string } {
  const basic = basicWordProblem(guess, dict);
  if (basic) return { problem: basic };
  if (data.found.includes(guess))
    return { problem: `You've already found ${guess.toUpperCase()}.` };
  const pair = puzzle.pairs.findIndex((p, i) => !data.found[i] && fits(guess, p, dict));
  if (pair === -1) {
    return { problem: `${guess.toUpperCase()} doesn't hinge any of today's pairs.` };
  }
  return { pair };
}

/** At most all but one letter can be revealed, so there's always something to find. */
export const maxHints = (length: number) => length - 1;

const solvedCount = (data: HingeData) => data.found.filter(Boolean).length;
const hintCount = (data: HingeData) => data.hints.reduce((a, b) => a + b, 0);

export function resultFor(data: HingeData, puzzle: HingePuzzle, gaveUp: boolean): GameResult {
  const solved = solvedCount(data);
  const all = solved === puzzle.pairs.length;
  const perfect = all && hintCount(data) === 0;
  return { score: solved, best: puzzle.pairs.length, perfect, gaveUp: gaveUp && !all };
}

/** Everything solved ends the game, hints or not. */
export const allSolved = (data: HingeData) => data.found.every(Boolean);

export function describeOutcome(data: HingeData, total: number): string {
  const solved = solvedCount(data);
  const hints = hintCount(data);
  const helped = hints ? `, with ${plural(hints, 'letter')} revealed` : '';
  if (solved === 0) return `You didn't find any of the ${total} hinges.`;
  if (solved === total) {
    return hints
      ? `You found all ${total} hinges${helped}.`
      : `You found all ${total} hinges without a single hint!`;
  }
  return `You found ${solved} of the ${total} hinges${helped}.`;
}

/** Spoiler-free share lines: 🟩 found unaided, 🟨 found with a hint, ⬜ not found. */
export function shareLines(data: HingeData): string[] {
  const squares = data.found
    .map((f, i) => (!f ? '⬜' : (data.hints[i] ?? 0) > 0 ? '🟨' : '🟩'))
    .join('');
  const solved = solvedCount(data);
  const hints = hintCount(data);
  const star = solved === data.found.length && hints === 0 ? '⭐ ' : '';
  return [
    `🔗 ${star}${solved}/${data.found.length} hinges${hints ? ` · ${plural(hints, 'hint')}` : ''}`,
    squares,
  ];
}
