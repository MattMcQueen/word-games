/**
 * Gutenberg Gap: a sentence from a public-domain novel with one word taken
 * out. Guess the word; each wrong guess reveals one of its letters. The book
 * and author are credited once the puzzle's over.
 *
 * Sentences come from the bank built by scripts/build-gutenberg.ts.
 */

import type { SentenceBook } from '../../core/sentences.ts';

export const SLUG = 'gutenberg-gap';
export const NAME = 'Gutenberg Gap';

/** Fixed seed for the order the bank is walked through, one sentence per day. */
export const ORDER_SEED = 'gutenberg-gap:order';

export interface GutenbergGapPuzzle {
  /** Which bank entry this is; the solver looks the word up from it. */
  entry: number;
  /** The sentence is before + (the missing word) + after. */
  before: string;
  after: string;
  /** Letters in the missing word. */
  length: number;
  /** The order letters are revealed in, as positions in the word. */
  reveal: number[];
  book: SentenceBook;
}

export interface GutenbergGapSolution {
  word: string;
}

/** Link to the book's page on Project Gutenberg. */
export const bookUrl = (book: SentenceBook) => `https://www.gutenberg.org/ebooks/${book.id}`;
