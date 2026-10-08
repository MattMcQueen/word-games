import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { contextFor, generateDaily } from '../../core/game.ts';
import { createRng } from '../../core/rng.ts';
import { acceptKeyhop, generateKeyhop } from './generate.ts';
import { keyhopLogic } from './logic.ts';
import { hopProblem } from './scoring.ts';
import { solveKeyhop } from './solve.ts';
import {
  firstBadHop,
  followsRules,
  type KeyhopPuzzle,
  MAX_BEST_ANSWERS,
  MIN_TOTAL,
} from './spec.ts';

const small = createDictionary(['dream', 'dress', 'dressed', 'dresser', 'drew', 'dews'].join('\n'));
const ctx = contextFor(small, '2026-10-08');
const puzzle: KeyhopPuzzle = { start: 'd', minLength: 4, reach: 2 };

describe('Keyhop rules', () => {
  it('finds the first hop that is too far', () => {
    expect(firstBadHop('dress', 2)).toBe(-1);
    expect(firstBadHop('dream', 2)).toBe(4); // A to M
    expect(firstBadHop('dream', 7)).toBe(-1);
  });

  it('checks start, length and hops', () => {
    expect(followsRules('dress', puzzle)).toBe(true);
    expect(followsRules('drew', { ...puzzle, minLength: 5 })).toBe(false);
    expect(followsRules('dews', { ...puzzle, start: 'e' })).toBe(false);
  });
});

describe('solveKeyhop', () => {
  it('finds the longest words that follow the rules', () => {
    // dream fails the hop rule; drew, dews, dress, dressed and dresser pass.
    expect(solveKeyhop(puzzle, ctx)).toEqual({
      bestLength: 7,
      answers: ['dressed', 'dresser'],
      total: 5,
    });
  });
});

describe('generateKeyhop', () => {
  it('makes a start key, minimum length and reach in range', () => {
    const rng = createRng('hops');
    for (let i = 0; i < 50; i++) {
      const p = generateKeyhop(rng);
      expect(p.start).toMatch(/^[a-z]$/);
      expect(p.minLength).toBeGreaterThanOrEqual(4);
      expect(p.minLength).toBeLessThanOrEqual(7);
      expect([2, 3]).toContain(p.reach);
    }
  });

  it('rejects puzzles with too few words, no stretch or too many best answers', () => {
    const sol = (bestLength: number, answers = 1, total = 20) => ({
      bestLength,
      answers: Array(answers).fill('x'),
      total,
    });
    expect(acceptKeyhop(puzzle, sol(6))).toBe(true);
    expect(acceptKeyhop(puzzle, sol(4))).toBe(false);
    expect(acceptKeyhop(puzzle, sol(6, 1, MIN_TOTAL - 1))).toBe(false);
    expect(acceptKeyhop(puzzle, sol(6, MAX_BEST_ANSWERS + 1))).toBe(false);
  });

  it('produces daily puzzles whose answers follow the rules', () => {
    const dict = createDictionary(readFileSync('public/data/words.txt', 'utf8'));
    for (let d = 1; d <= 20; d++) {
      const date = `2027-09-${String(d).padStart(2, '0')}`;
      const { puzzle: p, solution } = generateDaily(keyhopLogic, contextFor(dict, date));
      expect(solution.bestLength).toBeGreaterThan(p.minLength);
      for (const word of solution.answers) {
        expect(dict.has(word)).toBe(true);
        expect(followsRules(word, p)).toBe(true);
        expect(word).toHaveLength(solution.bestLength);
      }
    }
  });
});

describe('hopProblem', () => {
  it('explains rejected words', () => {
    expect(hopProblem('dress', puzzle, small, [])).toBeNull();
    expect(hopProblem('dews', { ...puzzle, start: 'e' }, small, [])).toBe(
      'Words start with E today.',
    );
    expect(hopProblem('drew', { ...puzzle, minLength: 5 }, small, [])).toBe(
      'Words need at least 5 letters today.',
    );
    expect(hopProblem('dream', puzzle, small, [])).toBe(
      'A to M is too far: each letter must be within 2 keys of the one before.',
    );
  });
});
