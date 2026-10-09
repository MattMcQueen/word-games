/**
 * Halves' player-facing rules: what joining two halves does, scoring, and the
 * words used in results and share text. Pure functions, unit tested; ui.ts
 * wires them up.
 */

import type { Dictionary } from '../../core/dictionary.ts';
import type { GameResult } from '../../core/progress.ts';
import { plural } from '../../core/text.ts';
import { type HalvesSolution, WORDS_PER_DAY } from './spec.ts';

export interface HalvesData {
  /**
   * Every pair of halves tried, in order. A right pair is stored in its
   * word's order (SUN, DAY), whichever half was picked first.
   */
  tries: [string, string][];
  /** Pairs joined by the hint button (missing in games saved before hints). */
  hints?: number;
}

export const emptyData = (): HalvesData => ({ tries: [] });

const sameHalves = (x: readonly string[], y: readonly string[]) =>
  (x[0] === y[0] && x[1] === y[1]) || (x[0] === y[1] && x[1] === y[0]);

/** The answer made by two halves, in either order, or undefined. */
const answerFor = (a: string, b: string, solution: HalvesSolution) =>
  solution.words.find((w) => sameHalves(w, [a, b]));

const isAnswer = (pair: [string, string], solution: HalvesSolution) =>
  answerFor(pair[0], pair[1], solution) !== undefined;

/** The pairs joined so far, in the order they were joined. */
export const joined = (data: HalvesData, solution: HalvesSolution) =>
  data.tries.filter((t) => isAnswer(t, solution));

export const mistakeCount = (data: HalvesData, solution: HalvesSolution) =>
  data.tries.length - joined(data, solution).length;

/** The halves still to be joined, in the puzzle's order. */
export function halvesLeft(halves: readonly string[], data: HalvesData, solution: HalvesSolution) {
  const used = new Set(joined(data, solution).flat());
  return halves.filter((half) => !used.has(half));
}

export type JoinOutcome =
  /** One of the six: the pair, in its word's order. */
  | { kind: 'joined'; pair: [string, string] }
  /** Wrong, and counted as a mistake. */
  | { kind: 'mistake'; message: string }
  /** Tried before, so not counted again. */
  | { kind: 'repeat'; message: string };

/** What happens when two halves are joined. */
export function tryJoin(
  a: string,
  b: string,
  solution: HalvesSolution,
  data: HalvesData,
  dict: Dictionary,
): JoinOutcome {
  const answer = answerFor(a, b, solution);
  if (answer) return { kind: 'joined', pair: answer };
  const A = a.toUpperCase();
  const B = b.toUpperCase();
  if (data.tries.some((t) => sameHalves(t, [a, b]))) {
    return { kind: 'repeat', message: `You've already tried ${A} with ${B}.` };
  }
  const word = [a + b, b + a].find((w) => dict.has(w));
  return {
    kind: 'mistake',
    message: word
      ? `${word.toUpperCase()} is a word, but not one of today's six.`
      : `${A} and ${B} don't make a word either way round.`,
  };
}

export const allJoined = (data: HalvesData, solution: HalvesSolution) =>
  joined(data, solution).length === solution.words.length;

export function resultFor(solution: HalvesSolution, data: HalvesData, gaveUp: boolean): GameResult {
  const done = joined(data, solution).length;
  const all = done === solution.words.length;
  return {
    score: done,
    best: solution.words.length,
    perfect: all && mistakeCount(data, solution) === 0 && !data.hints,
    gaveUp: gaveUp && !all,
  };
}

const NUMBERS = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
const inWords = (n: number) => NUMBERS[n] ?? String(n);

function outcomeBeforeHints(solution: HalvesSolution, data: HalvesData): string {
  const done = joined(data, solution).length;
  const mistakes = mistakeCount(data, solution);
  if (done === WORDS_PER_DAY) {
    return mistakes
      ? `You joined all six words, with ${plural(mistakes, 'mistake')}.`
      : 'You joined all six words without a single mistake!';
  }
  if (done === 0) return "You didn't join any of the six words.";
  return `You joined ${inWords(done)} of the six words.`;
}

/** Spoiler-free share lines: every join in order, 🟩 right and 🟥 wrong. */
function shareLinesBeforeHints(solution: HalvesSolution, data: HalvesData): string[] {
  const done = joined(data, solution).length;
  const mistakes = mistakeCount(data, solution);
  const squares = data.tries.map((t) => (isAnswer(t, solution) ? '🟩' : '🟥')).join('');
  const slips = mistakes ? plural(mistakes, 'mistake') : 'no mistakes';
  const headline =
    done === solution.words.length
      ? `${mistakes ? '' : '⭐ '}All six, ${slips}`
      : `${done}/${solution.words.length} words, ${slips}`;
  return [`✂️ ${headline}`, squares || '—'];
}

/** " A hint joined 1 pair.", for results; empty with no hints. */
const hintNote = (data: HalvesData) =>
  data.hints
    ? ` ${data.hints === 1 ? 'A hint' : 'Hints'} joined ${plural(data.hints, 'pair')}.`
    : '';

export const describeOutcome = (solution: HalvesSolution, data: HalvesData): string =>
  outcomeBeforeHints(solution, data) + hintNote(data);

/** Spoiler-free share lines; hints take away the star and are counted. */
export function shareLines(solution: HalvesSolution, data: HalvesData): string[] {
  const [headline = '', ...rest] = shareLinesBeforeHints(solution, data);
  if (!data.hints) return [headline, ...rest];
  return [`${headline.replace('⭐ ', '')} · ${plural(data.hints, 'hint')}`, ...rest];
}
