/**
 * Retitled: a famous book's title with its words swapped for synonyms
 * ("Battle and Calm"). Work out the real title (WAR AND PEACE), word by word.
 * Hints show the author or reveal a letter; afterwards there's a link to buy
 * the book.
 *
 * The reworded titles are in titles.json as [reworded, title, author], written
 * by hand. The titles are all on Shelf Scramble's shelf, so the two games can
 * avoid showing the same book on the same day.
 */

import titlesData from './titles.json' with { type: 'json' };

export const SLUG = 'retitled';
export const NAME = 'Retitled';

/** Fixed seed for the order the titles are used in, one a day. */
export const ORDER_SEED = 'retitled:order';

export const TITLES = titlesData as unknown as readonly (readonly [
  reworded: string,
  title: string,
  author: string,
])[];

export interface RetitledPuzzle {
  /** Index into TITLES; the solver looks the real title up from it. */
  entry: number;
  /** The title reworded, e.g. "Battle and Calm". */
  clue: string;
  /** Letters in each word of the real title. */
  lengths: number[];
  /** Words of the real title that the clue keeps (THE, AND, OF…): they start in place. */
  given: boolean[];
}

export interface RetitledSolution {
  title: string;
  author: string;
  /** The title's words, lowercase. */
  words: string[];
}

/** The clue's words, lowercase, without punctuation. */
export const clueWords = (clue: string) =>
  clue
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);

/** Which words of the title also appear in the clue, so are given. */
export function givenWords(clue: string, words: readonly string[]): boolean[] {
  const kept = new Set(clueWords(clue));
  return words.map((w) => kept.has(w));
}
