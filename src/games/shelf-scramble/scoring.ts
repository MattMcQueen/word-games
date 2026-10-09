/**
 * Shelf Scramble's player-facing rules: matching a typed word to the title,
 * hints, scoring, and the words used in results and share text. Pure
 * functions, unit tested; ui.ts wires them up.
 */

import type { GameResult } from '../../core/progress.ts';
import { plural } from '../../core/text.ts';
import { sortedLetters } from '../../solvers/letters.ts';
import { isGiven, type ShelfScramblePuzzle, type ShelfScrambleSolution } from './spec.ts';

export interface ShelfScrambleData {
  /** Which title words are in place (short words start in place). */
  found: boolean[];
  /** Letters revealed for each word. */
  revealed: number[];
  /** Whether the author has been shown. */
  author: boolean;
}

/** A fresh puzzle: only the short words are in place. */
export const emptyData = (puzzle: ShelfScramblePuzzle): ShelfScrambleData => ({
  found: puzzle.tiles.map(isGiven),
  revealed: puzzle.tiles.map(() => 0),
  author: false,
});

/**
 * What a typed word does: put one title word in place, put the whole rest of
 * the title in place (typed as one run of letters), or a message saying why not.
 */
export function matchGuess(
  guess: string,
  solution: ShelfScrambleSolution,
  data: ShelfScrambleData,
): { words: number[] } | { problem: string } {
  const open = solution.words.flatMap((_w, i) => (data.found[i] ? [] : [i]));
  // The whole title typed as one, with or without the words already in place.
  const rest = open.map((i) => solution.words[i]).join('');
  if (open.length > 1 && (guess === rest || guess === solution.words.join(''))) {
    return { words: open };
  }

  const exact = open.find((i) => solution.words[i] === guess);
  if (exact !== undefined) return { words: [exact] };

  const G = guess.toUpperCase();
  const key = sortedLetters(guess);
  if (open.some((i) => sortedLetters(solution.words[i] as string) === key)) {
    return { problem: `${G} uses the right letters, but it isn't the word.` };
  }
  return { problem: `${G} doesn't unscramble any word in the title.` };
}

/** Letters that can be revealed in a word: all but one. */
const maxReveal = (word: string) => word.length - 1;

/** The word a "Reveal a letter" hint goes to: the first unsolved word with letters left to show. */
export function nextToReveal(solution: ShelfScrambleSolution, data: ShelfScrambleData) {
  return solution.words.findIndex(
    (w, i) => !data.found[i] && (data.revealed[i] ?? 0) < maxReveal(w),
  );
}

export const hintCount = (data: ShelfScrambleData) =>
  data.revealed.reduce((a, b) => a + b, 0) + (data.author ? 1 : 0);

/** Words the player had to unscramble, and how many of them are done. */
function tally(solution: ShelfScrambleSolution, data: ShelfScrambleData) {
  const toSolve = solution.words.flatMap((w, i) => (isGiven(w) ? [] : [i]));
  return { total: toSolve.length, done: toSolve.filter((i) => data.found[i]).length };
}

export const allFound = (data: ShelfScrambleData) => data.found.every(Boolean);

export function resultFor(
  solution: ShelfScrambleSolution,
  data: ShelfScrambleData,
  gaveUp: boolean,
): GameResult {
  const { total, done } = tally(solution, data);
  const all = done === total;
  return {
    score: done,
    best: total,
    perfect: all && hintCount(data) === 0,
    gaveUp: gaveUp && !all,
  };
}

export function describeOutcome(solution: ShelfScrambleSolution, data: ShelfScrambleData): string {
  const { total, done } = tally(solution, data);
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
export function shareLines(solution: ShelfScrambleSolution, data: ShelfScrambleData): string[] {
  const squares = solution.words
    .flatMap((w, i) => {
      if (isGiven(w)) return [];
      if (!data.found[i]) return ['⬜'];
      return [(data.revealed[i] ?? 0) > 0 ? '🟨' : '🟩'];
    })
    .join('');
  const { total, done } = tally(solution, data);
  const hints = hintCount(data);
  const headline =
    done === total
      ? `${hints ? '' : '⭐ '}Solved${hints ? ` with ${plural(hints, 'hint')}` : ', no hints'}`
      : `${done}/${total} words`;
  return [`📚 ${headline}`, squares];
}
