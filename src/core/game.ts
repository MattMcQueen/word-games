/**
 * The contract every game's logic implements. Logic modules must stay free of
 * DOM and Node APIs so the same code runs in the puzzle generator script and,
 * as a fallback, in the browser.
 *
 * Adding a game means writing:
 *   - spec.ts      name, rules text and difficulty bounds
 *   - generate.ts  makes a random candidate puzzle from the seeded RNG
 *   - solve.ts     finds the optimum for a puzzle
 *   - ui.ts        the board, mounted inside the shared page shell
 * and registering the logic in src/games/registry.ts.
 */

import { LAUNCH_DATE } from '../config.ts';
import { daysBetween } from './date.ts';
import type { Dictionary } from './dictionary.ts';
import { createRng, dailySeed, type Rng } from './rng.ts';
import type { SentenceBank } from './sentences.ts';

/**
 * Extra data a generator can ask for (GameLogic.needs). The browser fetches
 * these only when it has to generate a puzzle itself, and only for games that
 * need them; the generator script reads them from public/data/.
 */
export type ResourceName = 'sentences' | 'common';

export interface Resources {
  /** The Gutenberg sentence bank (public/data/sentences.json). */
  sentences?: SentenceBank;
  /** Everyday words, a subset of the dictionary (public/data/common.txt). */
  common?: ReadonlySet<string>;
}

/** Everything a generator or solver may use. */
export interface GenerateContext extends Resources {
  dict: Dictionary;
  /** The date key the puzzle is for. */
  date: string;
  /** Days since launch: 0 on launch day. Lets a game walk through a fixed list without repeats. */
  dayIndex: number;
}

export interface GameLogic<P, S> {
  /** URL-safe id, also used in storage keys, seeds and puzzle file paths. */
  slug: string;
  /** Extra data generate() and solve() need, supplied in the context. */
  needs?: readonly ResourceName[];
  /** Make one candidate puzzle, or return null to try again with further random numbers. */
  generate(rng: Rng, ctx: GenerateContext): P | null;
  /** Solve a puzzle exactly, returning the optimum and the best answer(s). */
  solve(puzzle: P, ctx: GenerateContext): S;
  /** Difficulty filter: true if this puzzle/solution pair is good enough to publish. */
  accept(puzzle: P, solution: S, ctx: GenerateContext): boolean;
}

/** A published day: the puzzle and its precomputed solution. */
export interface DailyPuzzle<P, S> {
  puzzle: P;
  solution: S;
}

/** The shape of a puzzle file: public/puzzles/<slug>/<yyyy-mm>.json */
export interface PuzzleMonthFile<P, S> {
  game: string;
  month: string;
  days: Record<string, DailyPuzzle<P, S>>;
}

/** Safety valve so a badly tuned generator fails loudly instead of looping forever. */
const MAX_ATTEMPTS = 5000;

export function contextFor(
  dict: Dictionary,
  date: string,
  resources: Resources = {},
): GenerateContext {
  return { ...resources, dict, date, dayIndex: daysBetween(LAUNCH_DATE, date) };
}

/**
 * Generate the puzzle for one date. Deterministic: the RNG is seeded from the
 * game and date, and candidates are drawn from one stream until one is accepted.
 * Used by both scripts/generate-puzzles.ts and the browser fallback.
 */
export function generateDaily<P, S>(
  game: GameLogic<P, S>,
  ctx: GenerateContext,
): DailyPuzzle<P, S> {
  const rng = createRng(dailySeed(game.slug, ctx.date));
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const puzzle = game.generate(rng, ctx);
    if (puzzle === null) continue;
    const solution = game.solve(puzzle, ctx);
    if (game.accept(puzzle, solution, ctx)) return { puzzle, solution };
  }
  throw new Error(`${game.slug}: no acceptable puzzle for ${ctx.date} in ${MAX_ATTEMPTS} attempts`);
}
