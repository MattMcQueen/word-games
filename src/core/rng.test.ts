import { describe, expect, it } from 'vitest';
import { createRng, dailySeed } from './rng.ts';

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRng('price-tag:2026-10-08');
    const b = createRng('price-tag:2026-10-08');
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('gives different sequences for different seeds', () => {
    const a = createRng(dailySeed('price-tag', '2026-10-08'));
    const b = createRng(dailySeed('price-tag', '2026-10-09'));
    expect(a.next()).not.toEqual(b.next());
  });

  it('is pinned to known values, so puzzles never silently change', () => {
    // If this fails, every client-side fallback puzzle would differ from the
    // generated files. Only update it deliberately.
    const rng = createRng('fixed-seed');
    expect([rng.int(0, 999), rng.int(0, 999), rng.int(0, 999)]).toMatchInlineSnapshot(`
      [
        447,
        558,
        197,
      ]
    `);
  });

  it('keeps next() in [0, 1) and int() within bounds', () => {
    const rng = createRng('bounds');
    for (let i = 0; i < 10_000; i++) {
      const f = rng.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = rng.int(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
    }
  });

  it('hits every value in an int range', () => {
    const rng = createRng('coverage');
    const seen = new Set(Array.from({ length: 500 }, () => rng.int(1, 9)));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('shuffle returns a permutation without mutating the input', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    const out = createRng('shuffle').shuffle(input);
    expect(input).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect([...out].sort()).toEqual(input);
  });

  it('pick rejects an empty array', () => {
    expect(() => createRng('x').pick([])).toThrow();
  });
});
