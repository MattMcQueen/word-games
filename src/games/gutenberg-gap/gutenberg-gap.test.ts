import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { contextFor, generateDaily } from '../../core/game.ts';
import { createRng } from '../../core/rng.ts';
import type { SentenceBank } from '../../core/sentences.ts';
import { acceptGutenbergGap, generateGutenbergGap } from './generate.ts';
import { gutenbergGapLogic } from './logic.ts';
import {
  describeOutcome,
  guessProblem,
  isOver,
  pattern,
  resultFor,
  revealed,
  shareLines,
  wrongCount,
} from './scoring.ts';
import { solveGutenbergGap } from './solve.ts';
import { bookUrl, type GutenbergGapPuzzle } from './spec.ts';

const bank: SentenceBank = {
  books: [{ id: 1342, title: 'Pride and Prejudice', author: 'Jane Austen' }],
  entries: [
    { b: 0, before: 'It is a truth universally ', word: 'acknowledged', after: '.' },
    { b: 0, before: 'She was ', word: 'pleased', after: ' with the house.' },
    { b: 0, before: 'He gave a ', word: 'zzzzz', after: ' at the window.' },
  ],
};
const dict = createDictionary(
  ['acknowledged', 'castle', 'pleased', 'pleaded', 'teased'].join('\n'),
);

describe('generateGutenbergGap', () => {
  it('walks through the bank one sentence a day, skipping words not in the list', () => {
    const seen = new Set<number>();
    for (let d = 1; d <= 6; d++) {
      const ctx = contextFor(dict, `2026-10-0${d}`, bank);
      const p = generateGutenbergGap(createRng(`x${d}`), ctx);
      expect(p.entry).not.toBe(2); // zzzzz isn't a word
      seen.add(p.entry);
    }
    expect(seen).toEqual(new Set([0, 1]));
  });

  it('keeps the word out of the puzzle and reveals letters in a shuffled order', () => {
    const p = generateGutenbergGap(createRng('r'), contextFor(dict, '2026-10-01', bank));
    expect(JSON.stringify(p)).not.toContain(bank.entries[p.entry]?.word);
    expect([...p.reveal].sort((a, b) => a - b)).toEqual([...Array(p.length).keys()]);
    expect(p.book.author).toBe('Jane Austen');
  });

  it('needs the bank', () => {
    expect(() => generateGutenbergGap(createRng('r'), contextFor(dict, '2026-10-01'))).toThrow(
      /sentence bank/,
    );
  });

  it('looks the word up from the bank, and accepts only real words', () => {
    const ctx = contextFor(dict, '2026-10-01', bank);
    const p = generateGutenbergGap(createRng('r'), ctx);
    const solution = solveGutenbergGap(p, ctx);
    expect(solution.word).toBe(bank.entries[p.entry]?.word);
    expect(acceptGutenbergGap(p, solution, ctx)).toBe(true);
    expect(acceptGutenbergGap(p, { word: 'zzzzz' }, ctx)).toBe(false);
  });

  it('makes daily puzzles from the real bank', () => {
    const realDict = createDictionary(readFileSync('public/data/words.txt', 'utf8'));
    const realBank = JSON.parse(readFileSync('public/data/sentences.json', 'utf8')) as SentenceBank;
    const entries = new Set<number>();
    for (let d = 1; d <= 20; d++) {
      const date = `2027-11-${String(d).padStart(2, '0')}`;
      const { puzzle, solution } = generateDaily(
        gutenbergGapLogic,
        contextFor(realDict, date, realBank),
      );
      expect(realDict.has(solution.word)).toBe(true);
      expect(solution.word).toHaveLength(puzzle.length);
      entries.add(puzzle.entry);
    }
    expect(entries.size).toBe(20); // no repeats
  });
});

describe('Gutenberg Gap scoring', () => {
  const puzzle: GutenbergGapPuzzle = {
    entry: 1,
    before: 'She was ',
    after: ' with the house.',
    length: 7,
    reveal: [6, 0, 3, 1, 2, 4, 5],
    book: bank.books[0] as GutenbergGapPuzzle['book'],
  };
  const answer = 'pleased';

  it('reveals a letter for each wrong guess', () => {
    expect(wrongCount(['castle', 'pleased'], answer)).toBe(1);
    expect(pattern(answer, revealed(puzzle, 0))).toEqual(['', '', '', '', '', '', '']);
    expect(pattern(answer, revealed(puzzle, 2))).toEqual(['p', '', '', '', '', '', 'd']);
  });

  it('checks guesses', () => {
    expect(guessProblem('teased', puzzle, answer, dict, [])).toBe(
      'The missing word has 7 letters.',
    );
    expect(guessProblem('pleaded', puzzle, answer, dict, [])).toBeNull();
    expect(guessProblem('pleaded', puzzle, answer, dict, ['pleaded'])).toBe(
      "You've already tried PLEADED.",
    );
  });

  it('rejects guesses that clash with revealed letters', () => {
    const p = { ...puzzle, reveal: [1, 0, 2, 3, 4, 5, 6] }; // L shows first
    const d = createDictionary('pleased\nplacard\nblessed');
    expect(guessProblem('blessed', p, answer, d, ['placard'])).toBeNull();
    const d2 = createDictionary('pleased\nsnorted');
    expect(guessProblem('snorted', p, answer, d2, ['zzzzzzz'])).toBe(
      "SNORTED doesn't fit the letters shown.",
    );
  });

  it('ends on a right answer or when every letter is out', () => {
    expect(isOver(['castle'], answer)).toBe(false);
    expect(isOver(['castle', 'pleased'], answer)).toBe(true);
    expect(isOver(Array(7).fill('nope'), answer)).toBe(true);
  });

  it('scores, describes and shares the outcome without the word', () => {
    expect(resultFor(['pleased'], answer, false)).toEqual({
      score: 1,
      best: 1,
      perfect: true,
      gaveUp: false,
    });
    expect(resultFor(['pleaded', 'pleased'], answer, false)).toMatchObject({
      score: 2,
      perfect: false,
    });
    expect(resultFor(['pleaded'], answer, true)).toMatchObject({ score: 0, gaveUp: true });
    expect(describeOutcome(['pleased'], answer)).toBe('You got it in one!');
    expect(describeOutcome(['pleaded', 'pleased'], answer)).toBe('You got it in 2 guesses.');
    expect(describeOutcome(['pleaded'], answer)).toBe('The missing word was PLEASED.');
    expect(shareLines(['pleaded', 'pleased'], answer)).toEqual(['📖 Got it in 2/7', '⬛🟩']);
    expect(shareLines(['pleased'], answer)[0]).toBe('📖 ⭐ Got it in 1/7');
    expect(shareLines([], answer)).toEqual(['📖 Missed it (7 letters)', '—']);
  });

  it('links to the book', () => {
    expect(bookUrl(puzzle.book)).toBe('https://www.gutenberg.org/ebooks/1342');
  });
});
