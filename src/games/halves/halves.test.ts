import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { contextFor, generateDaily } from '../../core/game.ts';
import { halvesLogic } from './logic.ts';
import {
  allJoined,
  describeOutcome,
  emptyData,
  type HalvesData,
  halvesLeft,
  mistakeCount,
  resultFor,
  shareLines,
  tryJoin,
} from './scoring.ts';
import { pairings } from './solve.ts';
import type { HalvesSolution } from './spec.ts';

const small = createDictionary(
  ['board', 'cake', 'cup', 'cupboard', 'cupcake', 'pan', 'pancake'].join('\n'),
);
const solution: HalvesSolution = {
  words: [
    ['cup', 'board'],
    ['pan', 'cake'],
  ],
};

describe('Halves solver', () => {
  it('finds every way to pair all the halves', () => {
    expect(pairings(['board', 'cake', 'cup', 'pan'], small)).toEqual([
      [
        ['cup', 'board'],
        ['pan', 'cake'],
      ],
    ]);
    // CUP + CAKE works on its own, but then PAN and BOARD don't pair up.
    expect(pairings(['cup', 'cake', 'pan', 'board'], small, 5)).toHaveLength(1);
    expect(pairings(['cup', 'pan'], small)).toEqual([]);
  });
});

describe('generateHalves', () => {
  const dict = createDictionary(readFileSync('public/data/words.txt', 'utf8'));
  const common = new Set(createDictionary(readFileSync('public/data/common.txt', 'utf8')).words);

  it('needs the common words', () => {
    expect(() => generateDaily(halvesLogic, contextFor(dict, '2026-10-08'))).toThrow(/common/);
  });

  it('makes twelve different halves with exactly one way to pair them all', () => {
    for (let d = 1; d <= 14; d++) {
      const date = `2027-03-${String(d).padStart(2, '0')}`;
      const { puzzle, solution } = generateDaily(halvesLogic, contextFor(dict, date, { common }));
      expect(new Set(puzzle.halves).size).toBe(12);
      expect(pairings(puzzle.halves, dict, 2)).toHaveLength(1);
      expect(solution.words).toHaveLength(6);
      for (const [a, b] of solution.words) {
        expect(dict.has(a + b), `${a}+${b}`).toBe(true);
        // No STAB + BED = STABBED.
        expect(a.at(-1) === b[0] && /^(.)(ed|ing|er|est|en)$/.test(b), `${a}+${b}`).toBe(false);
      }
    }
  });
});

describe('Halves scoring', () => {
  it('joins the right halves in either order, in the word’s order', () => {
    const data = emptyData();
    expect(tryJoin('board', 'cup', solution, data, small)).toEqual({
      kind: 'joined',
      pair: ['cup', 'board'],
    });
  });

  it('counts a decoy word or a non-word as a mistake, but only once', () => {
    const data = emptyData();
    expect(tryJoin('cake', 'cup', solution, data, small)).toEqual({
      kind: 'mistake',
      message: "CUPCAKE is a word, but not one of today's six.",
    });
    expect(tryJoin('cup', 'pan', solution, data, small)).toEqual({
      kind: 'mistake',
      message: "CUP and PAN don't make a word either way round.",
    });
    data.tries.push(['cup', 'cake']);
    expect(tryJoin('cake', 'cup', solution, data, small)).toEqual({
      kind: 'repeat',
      message: "You've already tried CAKE with CUP.",
    });
  });

  it('tracks what is joined, what is left and the mistakes', () => {
    const data: HalvesData = {
      tries: [
        ['cup', 'cake'],
        ['cup', 'board'],
      ],
    };
    expect(halvesLeft(['board', 'cake', 'cup', 'pan'], data, solution)).toEqual(['cake', 'pan']);
    expect(mistakeCount(data, solution)).toBe(1);
    expect(allJoined(data, solution)).toBe(false);
    data.tries.push(['pan', 'cake']);
    expect(allJoined(data, solution)).toBe(true);
  });

  it('is perfect only with every word joined and no mistakes', () => {
    const clean: HalvesData = { tries: [...solution.words] };
    expect(resultFor(solution, clean, false)).toEqual({
      score: 2,
      best: 2,
      perfect: true,
      gaveUp: false,
    });
    const slip: HalvesData = { tries: [['cup', 'pan'], ...solution.words] };
    expect(resultFor(solution, slip, false).perfect).toBe(false);
    expect(resultFor(solution, { tries: [['cup', 'board']] }, true)).toEqual({
      score: 1,
      best: 2,
      perfect: false,
      gaveUp: true,
    });
  });

  it('describes the outcome and shares every join in order', () => {
    const six: HalvesSolution = {
      words: [
        ['sun', 'day'],
        ['cup', 'board'],
        ['pan', 'cake'],
        ['tea', 'pot'],
        ['foot', 'ball'],
        ['rain', 'bow'],
      ],
    };
    const all: HalvesData = { tries: [['sun', 'pot'], ...six.words] };
    expect(describeOutcome(six, all)).toBe('You joined all six words, with 1 mistake.');
    expect(shareLines(six, all)).toEqual(['✂️ All six, 1 mistake', '🟥🟩🟩🟩🟩🟩🟩']);
    expect(describeOutcome(six, { tries: [...six.words] })).toBe(
      'You joined all six words without a single mistake!',
    );
    expect(shareLines(six, { tries: [...six.words] })[0]).toBe('✂️ ⭐ All six, no mistakes');
    expect(describeOutcome(six, { tries: six.words.slice(0, 2) })).toBe(
      'You joined two of the six words.',
    );
    expect(describeOutcome(six, emptyData())).toBe("You didn't join any of the six words.");
    expect(shareLines(six, emptyData())).toEqual(['✂️ 0/6 words, no mistakes', '—']);
  });
});

describe('Halves hints', () => {
  it('count against a perfect day, and show in results and shares', () => {
    const helped: HalvesData = { tries: [...solution.words], hints: 1 };
    expect(resultFor(solution, helped, false).perfect).toBe(false);
    expect(resultFor(solution, helped, false).score).toBe(2);
    expect(describeOutcome(solution, helped)).toContain('A hint joined 1 pair.');
    expect(shareLines(solution, helped)[0]).not.toContain('⭐');
    expect(shareLines(solution, helped)[0]).toContain('1 hint');
  });
});
