import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { contextFor, generateDaily } from '../../core/game.ts';
import { sortedLetters } from '../../solvers/letters.ts';
import { nextToReveal } from '../title-words.ts';
import { shelfScrambleLogic } from './logic.ts';
import {
  allFound,
  describeOutcome,
  emptyData,
  hintCount,
  matchGuess,
  resultFor,
  shareLines,
} from './scoring.ts';
import { BOOKS, isGiven, type ShelfScrambleSolution, titleWords } from './spec.ts';

const dict = createDictionary('cat');
const pride: ShelfScrambleSolution = {
  title: 'Pride and Prejudice',
  author: 'Jane Austen',
  words: ['pride', 'and', 'prejudice'],
};
const puzzle = { entry: 0, tiles: ['edpri', 'dan', 'ejupcirde'] };

describe('the book list', () => {
  it('has plenty of titles, all plain letters, none repeated', () => {
    expect(BOOKS.length).toBeGreaterThanOrEqual(365);
    const titles = BOOKS.map(([title]) => title);
    expect(titles.every((t) => /^[A-Za-z]+( [A-Za-z]+)*$/.test(t))).toBe(true);
    expect(new Set(titles).size).toBe(titles.length);
    expect(BOOKS.every(([, author]) => author.length > 0)).toBe(true);
  });
});

describe('generateShelfScramble', () => {
  it('jumbles every longer word without leaving it as it was, and gives short ones', () => {
    for (let d = 1; d <= 60; d++) {
      const date = `2027-0${1 + Math.floor((d - 1) / 28)}-${String(((d - 1) % 28) + 1).padStart(2, '0')}`;
      const { puzzle: p, solution } = generateDaily(shelfScrambleLogic, contextFor(dict, date));
      expect(solution.words).toEqual(titleWords(solution.title));
      p.tiles.forEach((tiles, i) => {
        const word = solution.words[i] as string;
        expect(sortedLetters(tiles)).toBe(sortedLetters(word));
        if (isGiven(word)) expect(tiles).toBe(word);
        else if (new Set(word).size > 1) expect(tiles).not.toBe(word);
      });
    }
  });

  it("doesn't repeat a book until the shelf has been used", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const { puzzle: p } = generateDaily(shelfScrambleLogic, {
        ...contextFor(dict, '2027-01-01'),
        dayIndex: i,
      });
      seen.add(p.entry);
    }
    expect(seen.size).toBe(100);
  });
});

describe('Shelf Scramble scoring', () => {
  it('starts with the short words in place', () => {
    expect(emptyData({ entry: 0, tiles: ['emti', 'of', 'eth'] }).found).toEqual([
      false,
      true,
      false,
    ]);
  });

  it('places a typed word, or the whole title typed as one', () => {
    const data = emptyData(puzzle);
    expect(matchGuess('prejudice', pride, data)).toEqual({ words: [2] });
    expect(matchGuess('prideandprejudice', pride, data)).toEqual({ words: [0, 1, 2] });
    // With the short words given, both the rest and the full title work.
    const ofMice: ShelfScrambleSolution = {
      title: 'Of Mice and Men',
      author: 'John Steinbeck',
      words: ['of', 'mice', 'and', 'men'],
    };
    const given = emptyData({ entry: 0, tiles: ['of', 'ecim', 'dan', 'nem'] });
    expect(matchGuess('miceandmen', ofMice, given)).toEqual({ words: [1, 2, 3] });
    expect(matchGuess('ofmiceandmen', ofMice, given)).toEqual({ words: [1, 2, 3] });
  });

  it('explains near misses and misses', () => {
    const data = emptyData(puzzle);
    expect(matchGuess('dna', pride, data)).toEqual({
      problem: "DNA uses the right letters, but it isn't the word.",
    });
    expect(matchGuess('zebra', pride, data)).toEqual({
      problem: "ZEBRA doesn't unscramble any word in the title.",
    });
  });

  it('reveals letters in the first unsolved word, up to all but one', () => {
    const data = emptyData(puzzle);
    expect(nextToReveal(pride.words, data)).toBe(0);
    const pretty = { ...data, found: [true, false, false] };
    expect(nextToReveal(pride.words, pretty)).toBe(1);
    expect(
      nextToReveal(pride.words, { ...pretty, revealed: [0, 2, 8], found: [true, false, true] }),
    ).toBe(-1);
  });

  it('is perfect only with every word placed and no hints', () => {
    const done = { found: [true, true, true], revealed: [0, 0, 0], author: false };
    expect(allFound(done)).toBe(true);
    expect(resultFor(pride, done, false)).toEqual({
      score: 3,
      best: 3,
      perfect: true,
      gaveUp: false,
    });
    expect(resultFor(pride, { ...done, author: true }, false).perfect).toBe(false);
    expect(hintCount({ ...done, revealed: [1, 0, 2], author: true })).toBe(4);
  });

  it('describes and shares the outcome without the title', () => {
    const none = emptyData(puzzle);
    expect(describeOutcome(pride, none)).toBe("You didn't unscramble any of the title.");
    expect(describeOutcome(pride, { ...none, found: [true, false, false] })).toBe(
      'You unscrambled 1 of the 3 words.',
    );
    expect(
      describeOutcome(pride, { found: [true, true, true], revealed: [0, 0, 0], author: false }),
    ).toBe('You put the title back together without a single hint!');
    expect(
      shareLines(pride, { found: [true, true, true], revealed: [1, 0, 0], author: false }),
    ).toEqual(['📚 Solved with 1 hint', '🟨🟩🟩']);
    expect(
      shareLines(pride, { found: [true, true, true], revealed: [0, 0, 0], author: false })[0],
    ).toBe('📚 ⭐ Solved, no hints');
    const lines = shareLines(pride, { ...none, found: [true, false, false] }).join('\n');
    expect(lines).toContain('1/3 words');
    expect(lines.toLowerCase()).not.toContain('pride');
  });
});
