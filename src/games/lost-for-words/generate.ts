/**
 * Lost for Words generator. The bank is shuffled once with a fixed seed and
 * walked one sentence per day (by days since launch), so no sentence repeats
 * until the whole bank has been used. The day's own random numbers choose the
 * order its letters are revealed in.
 */

import type { GenerateContext } from '../../core/game.ts';
import type { Rng } from '../../core/rng.ts';
import { createRng } from '../../core/rng.ts';
import type { SentenceBank } from '../../core/sentences.ts';
import { type LostForWordsPuzzle, type LostForWordsSolution, ORDER_SEED } from './spec.ts';

const orders = new WeakMap<SentenceBank, number[]>();

/** The bank's fixed daily order (computed once per bank). */
function dailyOrder(bank: SentenceBank): number[] {
  let order = orders.get(bank);
  if (!order) {
    order = createRng(ORDER_SEED).shuffle(bank.entries.map((_, i) => i));
    orders.set(bank, order);
  }
  return order;
}

export function generateLostForWords(rng: Rng, ctx: GenerateContext): LostForWordsPuzzle {
  const bank = ctx.sentences;
  if (!bank || bank.entries.length === 0) throw new Error('Lost for Words needs the sentence bank');
  const order = dailyOrder(bank);
  const n = order.length;

  // Normally the day's own entry; if the word list has since dropped its word, the next one along.
  for (let step = 0; step < n; step++) {
    const entry = order[(((ctx.dayIndex + step) % n) + n) % n] as number;
    const { b, before, word, after } = bank.entries[entry] as SentenceBank['entries'][number];
    if (!ctx.dict.has(word)) continue;
    const book = bank.books[b];
    if (!book) continue;
    return {
      entry,
      before,
      after,
      length: word.length,
      reveal: rng.shuffle([...word].map((_, i) => i)),
      book,
    };
  }
  throw new Error('No sentence in the bank has a word in the word list');
}

export function acceptLostForWords(
  puzzle: LostForWordsPuzzle,
  solution: LostForWordsSolution,
  ctx: GenerateContext,
): boolean {
  return ctx.dict.has(solution.word) && solution.word.length === puzzle.length;
}
