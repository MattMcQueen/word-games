import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { contextFor, generateDaily } from '../../core/game.ts';
import { createRng } from '../../core/rng.ts';
import { acceptPriceTag, generatePriceTag } from './generate.ts';
import { priceTagLogic } from './logic.ts';
import { solvePriceTag } from './solve.ts';
import {
  compareScores,
  MAX_BEST_LENGTH,
  MAX_BUDGET,
  MIN_BEST_LENGTH,
  MIN_BUDGET,
  type PriceTagPuzzle,
  wordCost,
} from './spec.ts';

/** Prices where every letter costs `base`, with some overrides. */
function pricesWith(base: number, overrides: Record<string, number> = {}): number[] {
  return Array.from({ length: 26 }, (_, i) => overrides[String.fromCharCode(97 + i)] ?? base);
}

const small = createDictionary(
  ['cat', 'cart', 'carts', 'scat', 'zzz', 'act', 'tact'].sort().join('\n'),
);
const ctx = contextFor(small, '2026-10-08');

describe('Price Tag rules', () => {
  it('prices words by summing letter prices', () => {
    expect(wordCost('cat', pricesWith(1, { c: 4, a: 2, t: 5 }))).toBe(11);
  });

  it('ranks longer words first, then dearer ones', () => {
    expect(compareScores({ length: 5, cost: 10 }, { length: 4, cost: 20 })).toBeGreaterThan(0);
    expect(compareScores({ length: 4, cost: 18 }, { length: 4, cost: 20 })).toBeLessThan(0);
    expect(compareScores({ length: 4, cost: 20 }, { length: 4, cost: 20 })).toBe(0);
  });
});

describe('solvePriceTag', () => {
  it('finds the longest affordable word', () => {
    const puzzle: PriceTagPuzzle = { prices: pricesWith(2), budget: 10 };
    // carts = 10p fits exactly; no 6-letter words exist.
    expect(solvePriceTag(puzzle, ctx)).toEqual({ bestLength: 5, bestCost: 10, answers: ['carts'] });
  });

  it('breaks length ties by spending closest to the budget', () => {
    // 4-letter words: cart (c3 a1 r1 t1 = 6), scat (s5+3+1+1 = 10), tact (1+1+3+1 = 6).
    const puzzle: PriceTagPuzzle = { prices: pricesWith(1, { c: 3, s: 5 }), budget: 10 };
    expect(solvePriceTag(puzzle, ctx)).toEqual({ bestLength: 4, bestCost: 10, answers: ['scat'] });
  });

  it('lists every word that ties exactly', () => {
    const puzzle: PriceTagPuzzle = { prices: pricesWith(1, { s: 9 }), budget: 4 };
    // cart and tact both cost 4p; carts and scat are over budget.
    expect(solvePriceTag(puzzle, ctx).answers).toEqual(['cart', 'tact']);
  });

  it('returns no answers when nothing is affordable', () => {
    const puzzle: PriceTagPuzzle = { prices: pricesWith(9), budget: 5 };
    expect(solvePriceTag(puzzle, ctx)).toEqual({ bestLength: 0, bestCost: 0, answers: [] });
  });
});

describe('generatePriceTag', () => {
  it('makes 26 prices from 1p to 9p and a budget in range', () => {
    const rng = createRng('test');
    for (let i = 0; i < 50; i++) {
      const p = generatePriceTag(rng);
      expect(p.prices).toHaveLength(26);
      expect(p.prices.every((n) => Number.isInteger(n) && n >= 1 && n <= 9)).toBe(true);
      expect(p.budget).toBeGreaterThanOrEqual(MIN_BUDGET);
      expect(p.budget).toBeLessThanOrEqual(MAX_BUDGET);
    }
  });

  it('rejects optimums that are too short or too long', () => {
    const p = { prices: [], budget: 0 };
    const sol = (bestLength: number) => ({ bestLength, bestCost: 0, answers: [] });
    expect(acceptPriceTag(p, sol(MIN_BEST_LENGTH - 1))).toBe(false);
    expect(acceptPriceTag(p, sol(MIN_BEST_LENGTH))).toBe(true);
    expect(acceptPriceTag(p, sol(MAX_BEST_LENGTH))).toBe(true);
    expect(acceptPriceTag(p, sol(MAX_BEST_LENGTH + 1))).toBe(false);
  });
});

describe('Price Tag with the real dictionary', () => {
  const dict = createDictionary(readFileSync('public/data/words.txt', 'utf8'));

  it('produces solvable daily puzzles within the difficulty bounds', () => {
    for (let d = 1; d <= 30; d++) {
      const date = `2027-04-${String(d).padStart(2, '0')}`;
      const { puzzle, solution } = generateDaily(priceTagLogic, contextFor(dict, date));
      expect(solution.bestLength).toBeGreaterThanOrEqual(MIN_BEST_LENGTH);
      expect(solution.bestLength).toBeLessThanOrEqual(MAX_BEST_LENGTH);
      for (const word of solution.answers) {
        expect(dict.has(word)).toBe(true);
        expect(word).toHaveLength(solution.bestLength);
        expect(wordCost(word, puzzle.prices)).toBe(solution.bestCost);
      }
      expect(solution.bestCost).toBeLessThanOrEqual(puzzle.budget);
    }
  });
});
