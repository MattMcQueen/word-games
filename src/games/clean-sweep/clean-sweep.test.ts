import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { contextFor, generateDaily } from '../../core/game.ts';
import { createRng } from '../../core/rng.ts';
import { letterCounts, sortedLetters } from '../../solvers/letters.ts';
import { acceptCleanSweep, generateCleanSweep } from './generate.ts';
import { cleanSweepLogic } from './logic.ts';
import {
  betterSweep,
  describeOutcome,
  remainingCounts,
  resultFor,
  shareLines,
  sweepProblem,
} from './scoring.ts';
import { solveCleanSweep, sweep } from './solve.ts';
import { MAX_SOLUTIONS, MAX_WORDS, MIN_WORDS, TOTAL_LETTERS } from './spec.ts';

const small = createDictionary(['act', 'cat', 'dog', 'god', 'catdog', 'tac', 'sun'].join('\n'));

describe('sweep (the solver)', () => {
  it('finds the true minimum, preferring one long word', () => {
    expect(sweep('dogcat', small, 3)).toMatchObject({
      min: 1,
      solutions: 1,
      examples: [['catdog']],
    });
  });

  it('counts different sweeps once each, whatever the order', () => {
    // Without CATDOG: act/cat/tac × dog/god, plus sun, makes 3 × 2 = 6 three-word sweeps.
    const noCatdog = createDictionary('act\ncat\ndog\ngod\ntac\nsun');
    const result = sweep('catdogsun', noCatdog, 3);
    expect(result.min).toBe(3);
    expect(result.solutions).toBe(6);
    expect(result.examples[0]).toEqual(['act', 'dog', 'sun']);
  });

  it('stops at the fewest words', () => {
    expect(sweep('catdogsun', small, 3)).toMatchObject({ min: 2, examples: [['catdog', 'sun']] });
  });

  it('reports a pool that cannot be swept', () => {
    expect(sweep('catx', small, 3)).toEqual({ min: 0, solutions: 0, examples: [] });
  });
});

describe('generateCleanSweep', () => {
  const dict = createDictionary(readFileSync('public/data/words.txt', 'utf8'));
  const ctx = contextFor(dict, '2026-10-08');

  it('makes 15 lowercase letters', () => {
    const rng = createRng('sweeps');
    for (let i = 0; i < 50; i++) {
      const p = generateCleanSweep(rng, ctx);
      if (p) expect(p.letters).toMatch(new RegExp(`^[a-z]{${TOTAL_LETTERS}}$`));
    }
  });

  it('rejects sweeps that are too easy or too hard', () => {
    const p = { letters: '' };
    const sol = (min: number, solutions = 5) => ({ min, solutions, examples: [] });
    expect(acceptCleanSweep(p, sol(MIN_WORDS - 1))).toBe(false);
    expect(acceptCleanSweep(p, sol(MIN_WORDS))).toBe(true);
    expect(acceptCleanSweep(p, sol(MAX_WORDS))).toBe(true);
    expect(acceptCleanSweep(p, sol(MAX_WORDS + 1))).toBe(false);
    expect(acceptCleanSweep(p, sol(MIN_WORDS, MAX_SOLUTIONS + 1))).toBe(false);
  });

  it('produces daily puzzles whose example sweeps use every letter exactly once', () => {
    for (let d = 1; d <= 10; d++) {
      const date = `2027-08-${String(d).padStart(2, '0')}`;
      const { puzzle, solution } = generateDaily(cleanSweepLogic, contextFor(dict, date));
      expect(solution.min).toBeGreaterThanOrEqual(MIN_WORDS);
      expect(solution.min).toBeLessThanOrEqual(MAX_WORDS);
      for (const words of solution.examples) {
        expect(words).toHaveLength(solution.min);
        expect(words.every((w) => dict.has(w))).toBe(true);
        expect(sortedLetters(words.join(''))).toBe(sortedLetters(puzzle.letters));
      }
      // Nothing smaller exists.
      expect(solveCleanSweep(puzzle, contextFor(dict, date), solution.min - 1).min).toBe(0);
    }
  });
});

describe('Clean Sweep scoring', () => {
  const solution = { min: 2, solutions: 2, examples: [['cat', 'dog']] };

  it('tracks the letters left', () => {
    expect(remainingCounts('catdog', ['cat'])).toEqual(letterCounts('dog'));
  });

  it('checks a word against the letters left', () => {
    const left = letterCounts('dog');
    expect(sweepProblem('god', left, small)).toBeNull();
    expect(sweepProblem('cat', left, small)).toBe("There aren't the letters left for CAT.");
    expect(sweepProblem('dgo', left, small)).toBe("DGO isn't in the word list.");
  });

  it('keeps the complete sweep with fewest words', () => {
    expect(betterSweep(['a', 'b'], null)).toBe(true);
    expect(betterSweep(['a', 'b'], ['c', 'd', 'e'])).toBe(true);
    expect(betterSweep(['a', 'b', 'c'], ['d', 'e'])).toBe(false);
  });

  it('scores, describes and shares the outcome without the words', () => {
    expect(resultFor(null, solution, true)).toEqual({
      score: 0,
      best: 2,
      perfect: false,
      gaveUp: true,
    });
    expect(resultFor(['cat', 'dog'], solution, false).perfect).toBe(true);
    expect(describeOutcome(null, 2)).toBe(
      "You didn't sweep every letter; it can be done in 2 words.",
    );
    expect(describeOutcome(['a', 'b', 'c'], 2)).toBe(
      'You swept every letter in 3 words; the fewest possible was 2.',
    );
    expect(describeOutcome(['a', 'b'], 2)).toBe(
      'You swept every letter in 2 words: the fewest possible!',
    );
    expect(shareLines(['a', 'b', 'c'], 2)).toEqual(['🧹 Swept in 3 words (best 2)', '🟩🟩🟩⬜⬜']);
    expect(shareLines(['a', 'b'], 2)[0]).toBe('🧹 ⭐ Swept in 2, the fewest possible');
    expect(shareLines(null, 2)[0]).toBe('🧹 Not swept (best 2)');
  });
});
