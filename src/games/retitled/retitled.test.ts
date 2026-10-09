import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { contextFor, generateDaily } from '../../core/game.ts';
import shelfBooks from '../shelf-scramble/books.json' with { type: 'json' };
import { shelfScrambleTitle } from '../shelf-scramble/generate.ts';
import { retitledEntry } from './generate.ts';
import { retitledLogic } from './logic.ts';
import { describeOutcome, emptyData, matchGuess, resultFor, shareLines } from './scoring.ts';
import { givenWords, type RetitledPuzzle, type RetitledSolution, TITLES } from './spec.ts';

const dict = createDictionary('cat');
const war: RetitledSolution = {
  title: 'War and Peace',
  author: 'Leo Tolstoy',
  words: ['war', 'and', 'peace'],
};
const puzzle: RetitledPuzzle = {
  entry: 0,
  clue: 'Battle and Calm',
  lengths: [3, 3, 5],
  given: [false, true, false],
};

describe('the list of reworded titles', () => {
  const shelf = new Map(shelfBooks.map(([title, author]) => [title, author]));

  it('has a year of books, all on the shelf, none repeated', () => {
    expect(TITLES.length).toBeGreaterThanOrEqual(365);
    const titles = TITLES.map(([, title]) => title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const [, title, author] of TITLES) expect(shelf.get(title), title).toBe(author);
  });

  it('rewords every title, leaving at least one word to find', () => {
    for (const [clue, title] of TITLES) {
      const words = title.toLowerCase().split(' ');
      expect(clue.toLowerCase(), title).not.toBe(title.toLowerCase());
      expect(givenWords(clue, words).includes(false), title).toBe(true);
    }
  });
});

describe('generateRetitled', () => {
  it('gives the words the clue keeps, and the length of every word', () => {
    const { puzzle: p, solution } = generateDaily(retitledLogic, contextFor(dict, '2027-01-01'));
    expect(p.lengths).toEqual(solution.words.map((w) => w.length));
    expect(p.given).toEqual(givenWords(p.clue, solution.words));
    expect(TITLES[p.entry]?.[0]).toBe(p.clue);
  });

  it("doesn't repeat a book for months, or match Shelf Scramble's book on the day", () => {
    const seen = new Set<number>();
    for (let d = 0; d < 300; d++) seen.add(retitledEntry(d));
    expect(seen.size).toBeGreaterThan(290);
    for (let d = 0; d < 2000; d++) {
      expect(TITLES[retitledEntry(d)]?.[1]).not.toBe(shelfScrambleTitle(d));
    }
  });
});

describe('Retitled scoring', () => {
  it('starts with the kept words in place', () => {
    expect(emptyData(puzzle).found).toEqual([false, true, false]);
  });

  it('places a word, or the whole title typed as one', () => {
    const data = emptyData(puzzle);
    expect(matchGuess('peace', puzzle, war, data)).toEqual({ words: [2] });
    expect(matchGuess('warandpeace', puzzle, war, data)).toEqual({ words: [0, 2] });
    expect(matchGuess('warpeace', puzzle, war, data)).toEqual({ words: [0, 2] });
  });

  it('explains misses, including typing a word of the clue', () => {
    const data = emptyData(puzzle);
    expect(matchGuess('battle', puzzle, war, data)).toEqual({
      problem: 'BATTLE is in the new title. Which word did it replace?',
    });
    expect(matchGuess('fight', puzzle, war, data)).toEqual({
      problem: "FIGHT isn't one of the title's words.",
    });
    expect(matchGuess('and', puzzle, war, data)).toEqual({ problem: 'AND is already in place.' });
  });

  it('is perfect only with every word found and no hints, and shares no spoilers', () => {
    const done = { found: [true, true, true], revealed: [0, 0, 0], author: false };
    expect(resultFor(puzzle, done, false)).toEqual({
      score: 2,
      best: 2,
      perfect: true,
      gaveUp: false,
    });
    expect(describeOutcome(puzzle, done)).toBe('You found the real title without a single hint!');
    expect(describeOutcome(puzzle, { ...done, author: true })).toBe(
      'You found the real title, with 1 hint.',
    );
    const partial = { found: [true, true, false], revealed: [1, 0, 0], author: false };
    expect(describeOutcome(puzzle, partial)).toBe('You found 1 of the 2 words.');
    expect(describeOutcome(puzzle, emptyData(puzzle))).toBe(
      "You didn't find any of the real title.",
    );
    expect(shareLines(puzzle, partial)).toEqual(['📖 1/2 words', '🟨⬜']);
    expect(shareLines(puzzle, done)[0]).toBe('📖 ⭐ Solved, no hints');
  });
});
