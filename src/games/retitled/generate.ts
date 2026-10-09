/**
 * Retitled generator. The titles are shuffled once with a fixed seed and used
 * one a day (by days since launch), so a book doesn't come round again until
 * the whole list has been used. If Shelf Scramble has the same book that day,
 * Retitled takes the one half the list away instead.
 */

import type { GenerateContext } from '../../core/game.ts';
import { createRng } from '../../core/rng.ts';
import { shelfScrambleTitle } from '../shelf-scramble/generate.ts';
import { titleWords } from '../title-words.ts';
import {
  givenWords,
  ORDER_SEED,
  type RetitledPuzzle,
  type RetitledSolution,
  TITLES,
} from './spec.ts';

let order: number[] | undefined;

/** The title (index into TITLES) for a day. */
export function retitledEntry(dayIndex: number): number {
  order ??= createRng(ORDER_SEED).shuffle(TITLES.map((_, i) => i));
  const n = order.length;
  const at = (d: number) => order?.[((d % n) + n) % n] as number;
  const entry = at(dayIndex);
  return TITLES[entry]?.[1] === shelfScrambleTitle(dayIndex)
    ? at(dayIndex + Math.floor(n / 2))
    : entry;
}

export function generateRetitled(_rng: unknown, ctx: GenerateContext): RetitledPuzzle {
  const entry = retitledEntry(ctx.dayIndex);
  const [clue = '', title = ''] = TITLES[entry] ?? [];
  const words = titleWords(title);
  return { entry, clue, lengths: words.map((w) => w.length), given: givenWords(clue, words) };
}

export function acceptRetitled(puzzle: RetitledPuzzle, solution: RetitledSolution): boolean {
  return puzzle.lengths.every((n, i) => solution.words[i]?.length === n);
}
