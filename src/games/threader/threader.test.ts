import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { contextFor, generateDaily } from '../../core/game.ts';
import { createRng } from '../../core/rng.ts';
import { containsInOrder } from '../../solvers/letters.ts';
import { acceptThreader, generateThreader } from './generate.ts';
import { threaderLogic } from './logic.ts';
import {
  describeOutcome,
  resultFor,
  shareLines,
  threadPositions,
  threadProblem,
} from './scoring.ts';
import { solveThreader } from './solve.ts';
import {
  MAX_BEST_ANSWERS,
  MAX_EXTRA,
  MIN_EXTRA,
  MIN_TOTAL,
  type ThreaderSolution,
  threadInWords,
} from './spec.ts';

const small = createDictionary(['rant', 'return', 'runner', 'runt', 'tryst', 'warrant'].join('\n'));
const ctx = contextFor(small, '2026-10-08');

describe('solveThreader', () => {
  it('finds every shortest word containing the thread in order', () => {
    expect(solveThreader({ letters: 'rnt' }, ctx)).toEqual({
      bestLength: 4,
      answers: ['rant', 'runt'],
      total: 3, // rant, runt, warrant (return has T before N)
    });
  });

  it('reports no answers for an impossible thread', () => {
    expect(solveThreader({ letters: 'zzz' }, ctx)).toEqual({
      bestLength: 0,
      answers: [],
      total: 0,
    });
  });
});

describe('generateThreader', () => {
  const dict = createDictionary(readFileSync('public/data/words.txt', 'utf8'));
  const realCtx = contextFor(dict, '2026-10-08');

  it('makes 3- or 4-letter threads taken from a real word', () => {
    const rng = createRng('threads');
    for (let i = 0; i < 100; i++) {
      const p = generateThreader(rng, realCtx);
      if (!p) continue;
      expect([3, 4]).toContain(p.letters.length);
      expect(p.letters).toMatch(/^[a-z]+$/);
      expect(dict.words.some((w) => containsInOrder(w, p.letters))).toBe(true);
    }
  });

  it('rejects threads that are too easy, too hard or too narrow', () => {
    const sol = (bestLength: number, answers = 1, total = 50): ThreaderSolution => ({
      bestLength,
      answers: Array(answers).fill('x'),
      total,
    });
    const p = { letters: 'abc' };
    expect(acceptThreader(p, sol(3 + MIN_EXTRA - 1))).toBe(false);
    expect(acceptThreader(p, sol(3 + MIN_EXTRA))).toBe(true);
    expect(acceptThreader(p, sol(3 + MAX_EXTRA))).toBe(true);
    expect(acceptThreader(p, sol(3 + MAX_EXTRA + 1))).toBe(false);
    expect(acceptThreader(p, sol(6, MAX_BEST_ANSWERS + 1))).toBe(false);
    expect(acceptThreader(p, sol(6, 1, MIN_TOTAL - 1))).toBe(false);
  });

  it('produces daily puzzles within the difficulty bounds', () => {
    for (let d = 1; d <= 30; d++) {
      const date = `2027-05-${String(d).padStart(2, '0')}`;
      const { puzzle, solution } = generateDaily(threaderLogic, contextFor(dict, date));
      const extra = solution.bestLength - puzzle.letters.length;
      expect(extra).toBeGreaterThanOrEqual(MIN_EXTRA);
      expect(extra).toBeLessThanOrEqual(MAX_EXTRA);
      expect(solution.answers.length).toBeGreaterThanOrEqual(1);
      expect(solution.answers.length).toBeLessThanOrEqual(MAX_BEST_ANSWERS);
      for (const word of solution.answers) {
        expect(dict.has(word)).toBe(true);
        expect(word).toHaveLength(solution.bestLength);
        expect(containsInOrder(word, puzzle.letters)).toBe(true);
      }
    }
  });
});

describe('Threader scoring', () => {
  const solution: ThreaderSolution = { bestLength: 4, answers: ['rant', 'runt'], total: 3 };

  it('describes the thread in words', () => {
    expect(threadInWords('rnt')).toBe('R, N and T');
  });

  it('marks where the thread falls in a word', () => {
    expect(threadPositions('warrant', 'rnt')).toEqual([2, 5, 6]);
    expect(threadPositions('return', 'rnt')).toEqual([0, 5]); // T missing after the N
  });

  it('checks guesses', () => {
    expect(threadProblem('runt', { letters: 'rnt' }, small, [])).toBeNull();
    expect(threadProblem('return', { letters: 'rnt' }, small, [])).toBe(
      "RETURN doesn't have R, N and T in that order.",
    );
    expect(threadProblem('runt', { letters: 'rnt' }, small, ['runt'])).toBe(
      "You've already found RUNT.",
    );
  });

  it('scores the shortest word', () => {
    expect(resultFor(['warrant', 'runt'], solution, false)).toEqual({
      score: 4,
      best: 4,
      perfect: true,
      gaveUp: false,
    });
    expect(resultFor(['warrant'], solution, true)).toMatchObject({
      score: 7,
      perfect: false,
      gaveUp: true,
    });
  });

  it('describes the outcome', () => {
    expect(describeOutcome(null, solution)).toBe(
      "You didn't find a word; the shortest possible was 4 letters.",
    );
    expect(describeOutcome('warrant', solution)).toBe(
      'Your shortest word had 7 letters; the shortest possible was 4 letters.',
    );
    expect(describeOutcome('runt', solution)).toBe(
      'Your shortest word had 4 letters: the best possible!',
    );
  });

  it('shares lengths and counts but never the words', () => {
    expect(shareLines(['warrant'], solution, false)).toEqual([
      '🧵 Shortest: 7 letters (best 4)',
      '🟩🟩🟩⬜⬜',
      'Words found: 1',
    ]);
    expect(shareLines(['runt', 'warrant'], solution, true)[0]).toBe(
      '🧵 ⭐ 4 letters, the shortest possible',
    );
    expect(shareLines([], solution, false)[0]).toBe('🧵 Shortest: none (best 4)');
  });
});
