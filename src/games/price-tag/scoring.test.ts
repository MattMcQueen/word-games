import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { bestOf, describeOutcome, resultFor, shareLines, wordProblem } from './scoring.ts';
import type { PriceTagPuzzle, PriceTagSolution } from './spec.ts';

// Every letter costs 2p, so a word costs twice its length.
const puzzle: PriceTagPuzzle = { prices: Array(26).fill(2), budget: 10 };
const solution: PriceTagSolution = { bestLength: 5, bestCost: 10, answers: ['carts'] };
const dict = createDictionary('cat\ncart\ncarts\nstarts');

describe('wordProblem', () => {
  it('accepts an affordable new word', () => {
    expect(wordProblem('cart', puzzle, dict, [])).toBeNull();
  });

  it('applies the basic checks first', () => {
    expect(wordProblem('xyz', puzzle, dict, [])).toBe("XYZ isn't in the word list.");
  });

  it('rejects words over budget, saying by how much', () => {
    expect(wordProblem('starts', puzzle, dict, [])).toBe('STARTS costs 12p, 2p over budget.');
  });
});

describe('scoring the player', () => {
  it('picks the best word by length then cost', () => {
    expect(bestOf(['cat', 'cart'], puzzle.prices)).toEqual({ word: 'cart', length: 4, cost: 8 });
    expect(bestOf([], puzzle.prices)).toBeNull();
  });

  it('is perfect only when matching both length and cost', () => {
    expect(resultFor(['carts'], puzzle, solution, false)).toEqual({
      score: 5,
      best: 5,
      perfect: true,
      gaveUp: false,
    });
    expect(resultFor(['cart'], puzzle, solution, true)).toEqual({
      score: 4,
      best: 5,
      perfect: false,
      gaveUp: true,
    });
  });

  it('describes the outcome', () => {
    expect(describeOutcome(null, solution)).toBe(
      "You didn't find a word; the best possible was 5 letters (10p).",
    );
    expect(describeOutcome({ word: 'cart', length: 4, cost: 8 }, solution)).toBe(
      'You found 4 letters (8p); the best possible was 5 letters (10p).',
    );
    expect(describeOutcome({ word: 'carts', length: 5, cost: 10 }, solution)).toBe(
      'You found 5 letters for 10p: the best possible!',
    );
  });

  it('builds spoiler-free share lines', () => {
    const lines = shareLines({ word: 'cart', length: 4, cost: 8 }, puzzle, solution, false);
    expect(lines).toEqual(['4/5 letters · 8p of 10p', '🟩🟩🟩🟩⬜']);
    expect(lines.join('\n')).not.toContain('cart');
    expect(shareLines(null, puzzle, solution, false)[0]).toBe('0/5 letters · 0p of 10p');
  });
});
