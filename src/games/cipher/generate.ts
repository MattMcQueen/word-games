/**
 * Cipher generator. The bank is shuffled once with a fixed seed and walked one
 * line per day (by days since launch), so no line repeats until the whole
 * bank has been used. The day's own random numbers make the code: every letter
 * swapped for a different one.
 */

import type { GenerateContext } from '../../core/game.ts';
import { createRng, type Rng } from '../../core/rng.ts';
import type { LineBank } from '../../core/sentences.ts';
import { type CipherPuzzle, isLetter, ORDER_SEED } from './spec.ts';

const ALPHABET = [...'abcdefghijklmnopqrstuvwxyz'];

const orders = new WeakMap<LineBank, number[]>();

/** The bank's fixed daily order (computed once per bank). */
function dailyOrder(bank: LineBank): number[] {
  let order = orders.get(bank);
  if (!order) {
    order = createRng(ORDER_SEED).shuffle(bank.lines.map((_, i) => i));
    orders.set(bank, order);
  }
  return order;
}

/** A code: the letter each real letter becomes, never itself. */
export function makeCode(rng: Rng): Record<string, string> {
  let shuffled = rng.shuffle(ALPHABET);
  while (shuffled.some((ch, i) => ch === ALPHABET[i])) shuffled = rng.shuffle(ALPHABET);
  return Object.fromEntries(ALPHABET.map((ch, i) => [ch, shuffled[i] as string]));
}

export function generateCipher(rng: Rng, ctx: GenerateContext): CipherPuzzle {
  const bank = ctx.lines;
  if (!bank || bank.lines.length === 0) throw new Error('Cipher needs the line bank');
  const order = dailyOrder(bank);
  const n = order.length;
  const entry = order[((ctx.dayIndex % n) + n) % n] as number;
  const { b, text } = bank.lines[entry] as LineBank['lines'][number];
  const code = makeCode(rng);
  const coded = [...text.toLowerCase()].map((ch) => (isLetter(ch) ? code[ch] : ch)).join('');
  return { entry, coded, book: bank.books[b] as LineBank['books'][number] };
}
