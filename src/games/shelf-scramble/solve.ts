/** Shelf Scramble "solver": the title and author, looked up from the book list. */

import { BOOKS, type ShelfScramblePuzzle, type ShelfScrambleSolution, titleWords } from './spec.ts';

export function solveShelfScramble(puzzle: ShelfScramblePuzzle): ShelfScrambleSolution {
  const book = BOOKS[puzzle.entry];
  if (!book) throw new Error(`Book ${puzzle.entry} isn't on the shelf`);
  const [title, author] = book;
  return { title, author, words: titleWords(title) };
}
