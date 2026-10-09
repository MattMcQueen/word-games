/**
 * Cipher: a line from a classic novel with every letter swapped for another,
 * the same way throughout (a substitution cipher, as in a newspaper
 * cryptogram). Crack the code to read the line. Hints give away a letter;
 * afterwards the line is credited, with a link to buy the book.
 *
 * Lines come from the Cipher bank built by scripts/build-gutenberg.ts, which
 * never repeats a Lost for Words sentence.
 */

import type { SentenceBook } from '../../core/sentences.ts';

export const SLUG = 'cipher';
export const NAME = 'Cipher';

/** Fixed seed for the order the bank is walked through, one line per day. */
export const ORDER_SEED = 'cipher:order';

export interface CipherPuzzle {
  /** Which bank line this is; the solver looks the line up from it. */
  entry: number;
  /** The line in code, lowercase: each letter swapped, spaces and punctuation kept. */
  coded: string;
  book: SentenceBook;
}

export interface CipherSolution {
  /** The line as the author wrote it. */
  line: string;
  /** The real letter behind each code letter. */
  key: Record<string, string>;
}

export const isLetter = (ch: string) => ch >= 'a' && ch <= 'z';

/** The different code letters in a line, in the order they first appear. */
export const codeLetters = (coded: string) => [...new Set([...coded].filter(isLetter))];
