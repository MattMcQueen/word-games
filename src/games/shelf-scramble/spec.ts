/**
 * Shelf Scramble: the title of a well-known book with each word's letters
 * jumbled. Put the title back together. Hints show the author or reveal a
 * letter; afterwards there's a link to buy the book.
 *
 * The books are in books.json (title, author): titles of plain letters and
 * spaces only, so every tile is a letter.
 */

import booksData from './books.json' with { type: 'json' };

export const SLUG = 'shelf-scramble';
export const NAME = 'Shelf Scramble';

/** Fixed seed for the order the books are used in, one a day. */
export const ORDER_SEED = 'shelf-scramble:order';

/** Words this short (A, OF, IN…) are shown already in place. */
const SHOWN_MAX = 2;

export const BOOKS = booksData as unknown as readonly (readonly [title: string, author: string])[];

export interface ShelfScramblePuzzle {
  /** Index into BOOKS; the solver looks the title up from it. */
  entry: number;
  /** Each word of the title, its letters jumbled (lowercase). */
  tiles: string[];
}

export interface ShelfScrambleSolution {
  title: string;
  author: string;
  /** The title's words, lowercase. */
  words: string[];
}

export { titleWords } from '../title-words.ts';

/** Words the player has to unscramble (the short ones are given). */
export const isGiven = (word: string) => word.length <= SHOWN_MAX;
