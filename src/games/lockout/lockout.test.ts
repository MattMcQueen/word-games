import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { contextFor, generateDaily } from '../../core/game.ts';
import { createRng } from '../../core/rng.ts';
import { acceptLockout, generateLockout } from './generate.ts';
import { lockoutLogic } from './logic.ts';
import { lockoutProblem } from './scoring.ts';
import { solveLockout } from './solve.ts';
import {
  BANNED_COUNT,
  bannedIn,
  isAllowed,
  type LockoutPuzzle,
  MAX_BEST,
  MAX_BEST_ANSWERS,
  MIN_BEST,
  MIN_TOTAL,
} from './spec.ts';

const small = createDictionary(
  ['word', 'words', 'world', 'wordy', 'crowd', 'dog'].sort().join('\n'),
);
const ctx = contextFor(small, '2026-10-08');
const puzzle: LockoutPuzzle = { required: 'r', banned: 'aeilnstu' };

describe('Lockout rules', () => {
  it('lists the banned letters a word uses', () => {
    expect(bannedIn('words', puzzle.banned)).toEqual(['s']);
    expect(bannedIn('tassel', puzzle.banned)).toEqual(['t', 'a', 's', 'e', 'l']);
    expect(bannedIn('word', puzzle.banned)).toEqual([]);
  });

  it('needs the required letter and no banned ones', () => {
    expect(isAllowed('word', puzzle)).toBe(true);
    expect(isAllowed('words', puzzle)).toBe(false);
    expect(isAllowed('dog', puzzle)).toBe(false);
  });
});

describe('solveLockout', () => {
  it('finds the longest allowed words', () => {
    // word, wordy, crowd allowed; words (s), world (l) and dog (no r) aren't.
    expect(solveLockout(puzzle, ctx)).toEqual({
      bestLength: 5,
      answers: ['crowd', 'wordy'],
      total: 3,
    });
  });
});

describe('generateLockout', () => {
  it('bans eight letters, never the required one', () => {
    const rng = createRng('locks');
    for (let i = 0; i < 50; i++) {
      const p = generateLockout(rng);
      expect(p.banned).toHaveLength(BANNED_COUNT);
      expect(p.banned).not.toContain(p.required);
      expect([...p.banned].sort().join('')).toBe(p.banned);
    }
  });

  it('rejects longest words that are too short or too long, and crowded days', () => {
    const sol = (bestLength: number, answers = 2, total = 50) => ({
      bestLength,
      answers: Array(answers).fill('x'),
      total,
    });
    expect(acceptLockout(puzzle, sol(MIN_BEST - 1))).toBe(false);
    expect(acceptLockout(puzzle, sol(MIN_BEST))).toBe(true);
    expect(acceptLockout(puzzle, sol(MAX_BEST))).toBe(true);
    expect(acceptLockout(puzzle, sol(MAX_BEST + 1))).toBe(false);
    expect(acceptLockout(puzzle, sol(8, MAX_BEST_ANSWERS + 1))).toBe(false);
    expect(acceptLockout(puzzle, sol(8, 2, MIN_TOTAL - 1))).toBe(false);
  });

  it('produces daily puzzles whose answers are allowed', () => {
    const dict = createDictionary(readFileSync('public/data/words.txt', 'utf8'));
    for (let d = 1; d <= 8; d++) {
      const date = `2027-10-${String(d).padStart(2, '0')}`;
      const { puzzle: p, solution } = generateDaily(lockoutLogic, contextFor(dict, date));
      for (const word of solution.answers) {
        expect(dict.has(word)).toBe(true);
        expect(isAllowed(word, p)).toBe(true);
        expect(word).toHaveLength(solution.bestLength);
      }
    }
  });
});

describe('lockoutProblem', () => {
  it('explains rejected words', () => {
    expect(lockoutProblem('crowd', puzzle, small, [])).toBeNull();
    expect(lockoutProblem('words', puzzle, small, [])).toBe('WORDS uses S, which is locked out.');
    expect(lockoutProblem('world', { required: 'r', banned: 'dl' }, small, [])).toBe(
      'WORLD uses L and D, which are locked out.',
    );
    expect(lockoutProblem('dog', puzzle, small, [])).toBe('Words must include R.');
  });
});
