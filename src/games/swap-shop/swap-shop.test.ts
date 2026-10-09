import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { contextFor, generateDaily } from '../../core/game.ts';
import { createRng } from '../../core/rng.ts';
import { acceptSwapShop, generateSwapShop } from './generate.ts';
import { swapShopLogic } from './logic.ts';
import { describeOutcome, missedPairs, resultFor, shareLines, swapProblem } from './scoring.ts';
import { solveSwapShop } from './solve.ts';
import {
  lengthRule,
  MAX_PAIRS,
  MIN_PAIRS,
  pairKey,
  pairLabel,
  type SwapShopPuzzle,
  swapLetters,
} from './spec.ts';

const small = createDictionary(
  ['ate', 'bat', 'bean', 'bet', 'cat', 'eta', 'panel', 'penal'].join('\n'),
);
const ctx = contextFor(small, '2026-10-08');
const ae: SwapShopPuzzle = { letters: 'ae', length: null };

describe('Swap Shop rules', () => {
  it('swaps both letters at once', () => {
    expect(swapLetters('bat', 'a', 'e')).toBe('bet');
    expect(swapLetters('panel', 'a', 'e')).toBe('penal');
    expect(swapLetters('cut', 'a', 'e')).toBe('cut');
  });

  it('keys a pair the same way from either word', () => {
    expect(pairKey('bet', 'bat')).toBe('bat/bet');
    expect(pairKey('bat', 'bet')).toBe('bat/bet');
    expect(pairLabel('bat/bet')).toBe('BAT ↔ BET');
  });

  it('describes the length rule', () => {
    expect(lengthRule(null)).toBe('Words of any length');
    expect(lengthRule(5)).toBe('5-letter words only');
  });
});

describe('solveSwapShop', () => {
  it('finds each pair once', () => {
    // bean → baen isn't a word, and cat has neither letter.
    expect(solveSwapShop(ae, ctx)).toEqual({
      pairs: ['ate/eta', 'bat/bet', 'panel/penal'],
      also: {},
    });
  });

  it('honours the length rule', () => {
    expect(solveSwapShop({ letters: 'ae', length: 3 }, ctx)).toEqual({
      pairs: ['ate/eta', 'bat/bet'],
      also: {},
    });
  });

  it('folds inflected pairs into their family', () => {
    const dict = createDictionary(
      ['bat', 'bats', 'bet', 'bets', 'jape', 'japed', 'japing', 'vape', 'vaped', 'vaping'].join(
        '\n',
      ),
    );
    expect(solveSwapShop({ letters: 'ae', length: null }, contextFor(dict, '2026-10-08'))).toEqual({
      pairs: ['bat/bet'],
      also: { 'bat/bet': ['bats/bets'] },
    });
    expect(solveSwapShop({ letters: 'jv', length: null }, contextFor(dict, '2026-10-08'))).toEqual({
      pairs: ['jape/vape'],
      also: { 'jape/vape': ['japed/vaped', 'japing/vaping'] },
    });
  });

  it('makes pairs of rarer words bonuses', () => {
    const everyday = new Set(['ate', 'bat', 'bet', 'panel', 'penal']);
    // eta isn't an everyday word, so ate/eta is a bonus.
    expect(solveSwapShop(ae, contextFor(small, '2026-10-08', { common: everyday }))).toEqual({
      pairs: ['bat/bet', 'panel/penal'],
      also: {},
      bonus: ['ate/eta'],
    });
  });
});

describe('generateSwapShop', () => {
  it('picks two different letters in order and a length rule', () => {
    const rng = createRng('swaps');
    for (let i = 0; i < 100; i++) {
      const { letters, length } = generateSwapShop(rng);
      expect(letters).toMatch(/^[a-z]{2}$/);
      expect([...letters].sort().join('')).toBe(letters);
      expect(letters[0]).not.toBe(letters[1]);
      expect([null, 4, 5, 6, 7]).toContain(length);
    }
  });

  it('rejects days with too few or too many pairs', () => {
    const sol = (n: number) => ({ pairs: Array(n).fill('a/b'), also: {} });
    expect(acceptSwapShop(ae, sol(MIN_PAIRS - 1))).toBe(false);
    expect(acceptSwapShop(ae, sol(MIN_PAIRS))).toBe(true);
    expect(acceptSwapShop(ae, sol(MAX_PAIRS))).toBe(true);
    expect(acceptSwapShop(ae, sol(MAX_PAIRS + 1))).toBe(false);
  });

  it('produces daily puzzles within the bounds, with real pairs', () => {
    const dict = createDictionary(readFileSync('public/data/words.txt', 'utf8'));
    for (let d = 1; d <= 20; d++) {
      const date = `2027-06-${String(d).padStart(2, '0')}`;
      const { puzzle, solution } = generateDaily(swapShopLogic, contextFor(dict, date));
      const [a = '', b = ''] = puzzle.letters;
      expect(solution.pairs.length).toBeGreaterThanOrEqual(MIN_PAIRS);
      expect(solution.pairs.length).toBeLessThanOrEqual(MAX_PAIRS);
      for (const key of solution.pairs) {
        const [first = '', second = ''] = key.split('/');
        expect(dict.has(first) && dict.has(second)).toBe(true);
        expect(swapLetters(first, a, b)).toBe(second);
        if (puzzle.length !== null) expect(first).toHaveLength(puzzle.length);
      }
    }
  });
});

describe('Swap Shop scoring', () => {
  const solution = {
    pairs: ['ate/eta', 'bat/bet', 'panel/penal'],
    also: { 'bat/bet': ['bats/bets'] },
  };

  it('checks guesses', () => {
    expect(swapProblem('bet', ae, solution, small, [])).toBeNull();
    expect(swapProblem('cat', { letters: 'ou', length: null }, solution, small, [])).toBe(
      'CAT has no O or U to swap.',
    );
    expect(swapProblem('bean', ae, solution, small, [])).toBe(
      "BEAN becomes BAEN, which isn't in the word list.",
    );
    expect(swapProblem('panel', { letters: 'ae', length: 3 }, solution, small, [])).toBe(
      "Today's words have 3 letters.",
    );
    expect(swapProblem('bet', ae, solution, small, ['bat/bet'])).toBe(
      "You've already found BAT ↔ BET.",
    );
    // An inflected form counts as its family, so it's already found too.
    const withPlurals = createDictionary('bat\nbats\nbet\nbets');
    expect(swapProblem('bets', ae, solution, withPlurals, ['bat/bet'])).toBe(
      "You've already found BAT ↔ BET.",
    );
  });

  it('scores pairs found against the total', () => {
    expect(resultFor(['bat/bet'], solution, true)).toEqual({
      score: 1,
      best: 3,
      perfect: false,
      gaveUp: true,
    });
    expect(resultFor(solution.pairs, solution, false).perfect).toBe(true);
  });

  it('lists the pairs missed', () => {
    expect(missedPairs(['bat/bet'], solution)).toEqual(['ate/eta', 'panel/penal']);
  });

  it('describes the outcome', () => {
    expect(describeOutcome(0, 3)).toBe("You didn't find any of the 3 pairs.");
    expect(describeOutcome(1, 3)).toBe('You found 1 of the 3 pairs.');
    expect(describeOutcome(3, 3)).toBe('You found all 3 pairs!');
    expect(describeOutcome(3, 3, 2)).toBe('You found all 3 pairs! You also found 2 bonus pairs.');
  });

  it('shares the swap and the count, never the words', () => {
    expect(shareLines(1, ae, solution)).toEqual(['🔁 A ↔ E · 1/3 pairs', '🟩🟩⬜⬜⬜']);
    expect(shareLines(3, ae, solution)[0]).toBe('🔁 A ↔ E · ⭐ 3/3 pairs');
    expect(shareLines(3, ae, solution, 1)[0]).toBe('🔁 A ↔ E · ⭐ 3/3 pairs +1 bonus');
  });
});
