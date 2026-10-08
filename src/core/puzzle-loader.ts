/**
 * Loads a day's puzzle. Normally it comes from the pre-generated monthly JSON
 * file; if that file is missing, unreachable or lacks the date (e.g. we're past
 * the generated range), the puzzle is generated in the browser from the same
 * seeded generator, so the site never breaks.
 */

import { puzzleMonthUrl } from '../config.ts';
import { monthOf } from './date.ts';
import { type Dictionary, loadDictionary } from './dictionary.ts';
import {
  contextFor,
  type DailyPuzzle,
  type GameLogic,
  generateDaily,
  type PuzzleMonthFile,
} from './game.ts';

export interface LoadedPuzzle<P, S> extends DailyPuzzle<P, S> {
  /** Where the puzzle came from; handy for debugging and tests. */
  source: 'file' | 'generated';
}

/** One request per month file per page load, shared by every caller. */
const monthCache = new Map<string, Promise<PuzzleMonthFile<unknown, unknown> | null>>();

function fetchMonth(slug: string, month: string) {
  const url = puzzleMonthUrl(slug, month);
  let pending = monthCache.get(url);
  if (!pending) {
    pending = fetch(url)
      .then((res) => (res.ok ? (res.json() as Promise<PuzzleMonthFile<unknown, unknown>>) : null))
      .catch(() => null); // offline, 404 page served as HTML, etc. → fall back
    monthCache.set(url, pending);
  }
  return pending;
}

export async function loadDailyPuzzle<P, S>(
  game: GameLogic<P, S>,
  date: string,
  getDictionary: () => Promise<Dictionary> = loadDictionary,
): Promise<LoadedPuzzle<P, S>> {
  const file = (await fetchMonth(game.slug, monthOf(date))) as PuzzleMonthFile<P, S> | null;
  const day = file?.days?.[date];
  if (day) return { ...day, source: 'file' };

  const ctx = contextFor(await getDictionary(), date);
  return { ...generateDaily(game, ctx), source: 'generated' };
}
