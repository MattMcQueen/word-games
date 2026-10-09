/**
 * Shelf Scramble generator. The books are shuffled once with a fixed seed and
 * used one a day (by days since launch), so a title doesn't come round again
 * until the whole shelf has been used. The day's random numbers jumble each
 * word, making sure it never comes out unchanged.
 */

import type { GenerateContext } from '../../core/game.ts';
import { createRng, type Rng } from '../../core/rng.ts';
import {
  BOOKS,
  isGiven,
  ORDER_SEED,
  type ShelfScramblePuzzle,
  type ShelfScrambleSolution,
  titleWords,
} from './spec.ts';

let order: number[] | undefined;

/** Jumble a word's letters; tries again if that left it as it was (unless every letter is the same). */
function jumble(word: string, rng: Rng): string {
  if (new Set(word).size < 2) return word;
  for (let i = 0; i < 20; i++) {
    const jumbled = rng.shuffle([...word]).join('');
    if (jumbled !== word) return jumbled;
  }
  return [...word].reverse().join('');
}

/** The book (index into BOOKS) for a day. */
function entryFor(dayIndex: number): number {
  order ??= createRng(ORDER_SEED).shuffle(BOOKS.map((_, i) => i));
  const n = order.length;
  return order[((dayIndex % n) + n) % n] as number;
}

/** The title of the day's book; Retitled checks it to avoid showing the same one. */
export const shelfScrambleTitle = (dayIndex: number) => BOOKS[entryFor(dayIndex)]?.[0] ?? '';

export function generateShelfScramble(rng: Rng, ctx: GenerateContext): ShelfScramblePuzzle {
  const entry = entryFor(ctx.dayIndex);
  const [title = ''] = BOOKS[entry] ?? [];
  return {
    entry,
    tiles: titleWords(title).map((word) => (isGiven(word) ? word : jumble(word, rng))),
  };
}

export function acceptShelfScramble(
  puzzle: ShelfScramblePuzzle,
  solution: ShelfScrambleSolution,
): boolean {
  return puzzle.tiles.length === solution.words.length;
}
