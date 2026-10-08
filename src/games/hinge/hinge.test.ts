import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { contextFor, generateDaily } from '../../core/game.ts';
import { hingeIndex } from './hinge-index.ts';
import { hingeLogic } from './logic.ts';
import {
  allSolved,
  describeOutcome,
  emptyData,
  matchGuess,
  maxHints,
  resultFor,
  shareLines,
} from './scoring.ts';
import { hingesFor } from './solve.ts';
import { fits, type HingePuzzle, PAIRS_PER_DAY } from './spec.ts';

const words = [
  'bird',
  'birdcage',
  'blue',
  'bluebird',
  'cage',
  'car',
  'carpet',
  'pet',
  'petrol',
  'rol',
];
const small = createDictionary([...words].sort().join('\n'));
const common = new Set(words);

describe('Hinge rules', () => {
  it('a hinge finishes the left word and starts the right one', () => {
    const pair = { left: 'blue', right: 'cage', length: 4 };
    expect(fits('bird', pair, small)).toBe(true);
    expect(fits('cage', pair, small)).toBe(false);
    expect(hingesFor(pair, small)).toEqual(['bird']);
  });

  it('indexes everyday splits, both ways round', () => {
    const index = hingeIndex(small, common);
    expect(index.before.get('bird')).toEqual(['blue']);
    expect(index.after.get('bird')).toEqual(['cage']);
    expect(index.hinges).toContain('bird');
    expect(index.hinges).toContain('pet');
  });

  it('leaves plurals out of the index', () => {
    const dict = createDictionary(['bird', 'birds', 'blue', 'bluebirds', 'cage'].join('\n'));
    expect(
      hingeIndex(dict, new Set(['bird', 'birds', 'blue', 'bluebirds'])).before.get('birds'),
    ).toBe(undefined);
  });
});

describe('generateHinge', () => {
  const dict = createDictionary(readFileSync('public/data/words.txt', 'utf8'));
  const everyday = new Set(createDictionary(readFileSync('public/data/common.txt', 'utf8')).words);

  it('needs the common words', () => {
    expect(() => generateDaily(hingeLogic, contextFor(dict, '2026-10-08'))).toThrow(/common/);
  });

  it('makes five pairs, each with exactly one answer, and no hinge repeats for weeks', () => {
    const seen = new Map<string, string>();
    for (let d = 1; d <= 28; d++) {
      const date = `2027-02-${String(d).padStart(2, '0')}`;
      const { puzzle, solution } = generateDaily(
        hingeLogic,
        contextFor(dict, date, { common: everyday }),
      );
      expect(puzzle.pairs).toHaveLength(PAIRS_PER_DAY);
      puzzle.pairs.forEach((pair, i) => {
        const answer = solution.answers[i] as string;
        expect(hingesFor(pair, dict)).toEqual([answer]);
        expect(everyday.has(pair.left) && everyday.has(pair.right) && everyday.has(answer)).toBe(
          true,
        );
        expect(seen.has(answer), `${answer} on ${seen.get(answer)} and ${date}`).toBe(false);
        seen.set(answer, date);
      });
    }
  });
});

describe('Hinge scoring', () => {
  const puzzle: HingePuzzle = {
    pairs: [
      { left: 'car', right: 'rol', length: 3 },
      { left: 'blue', right: 'cage', length: 4 },
    ],
  };

  it('matches a guess to the pair it hinges', () => {
    const data = emptyData(puzzle);
    expect(matchGuess('bird', puzzle, data, small)).toEqual({ pair: 1 });
    expect(matchGuess('pet', puzzle, data, small)).toEqual({ pair: 0 });
    expect(matchGuess('cage', puzzle, data, small)).toEqual({
      problem: "CAGE doesn't hinge any of today's pairs.",
    });
    expect(matchGuess('xyz', puzzle, data, small)).toEqual({
      problem: "XYZ isn't in the word list.",
    });
    expect(matchGuess('pet', puzzle, { ...data, found: ['pet', ''] }, small)).toEqual({
      problem: "You've already found PET.",
    });
  });

  it('allows hints up to all but one letter', () => {
    expect(maxHints(4)).toBe(3);
  });

  it('is perfect only with every pair found and no hints', () => {
    expect(resultFor({ found: ['pet', 'bird'], hints: [0, 0] }, puzzle, false)).toEqual({
      score: 2,
      best: 2,
      perfect: true,
      gaveUp: false,
    });
    expect(resultFor({ found: ['pet', 'bird'], hints: [1, 0] }, puzzle, false).perfect).toBe(false);
    expect(resultFor({ found: ['pet', ''], hints: [0, 0] }, puzzle, true)).toMatchObject({
      score: 1,
      gaveUp: true,
    });
    expect(allSolved({ found: ['pet', 'bird'], hints: [0, 0] })).toBe(true);
  });

  it('describes and shares the outcome without the words', () => {
    expect(describeOutcome({ found: ['', ''], hints: [0, 0] }, 2)).toBe(
      "You didn't find any of the 2 hinges.",
    );
    expect(describeOutcome({ found: ['pet', ''], hints: [2, 0] }, 2)).toBe(
      'You found 1 of the 2 hinges, with 2 letters revealed.',
    );
    expect(describeOutcome({ found: ['pet', 'bird'], hints: [0, 0] }, 2)).toBe(
      'You found all 2 hinges without a single hint!',
    );
    expect(shareLines({ found: ['pet', 'bird'], hints: [0, 1] })).toEqual([
      '🔗 2/2 hinges · 1 hint',
      '🟩🟨',
    ]);
    expect(shareLines({ found: ['pet', ''], hints: [0, 0] })[1]).toBe('🟩⬜');
    expect(shareLines({ found: ['pet', 'bird'], hints: [0, 0] })[0]).toBe('🔗 ⭐ 2/2 hinges');
  });
});
