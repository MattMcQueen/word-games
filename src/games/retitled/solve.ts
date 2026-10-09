/** Retitled "solver": the real title and author, looked up from the list. */

import { titleWords } from '../title-words.ts';
import { type RetitledPuzzle, type RetitledSolution, TITLES } from './spec.ts';

export function solveRetitled(puzzle: RetitledPuzzle): RetitledSolution {
  const entry = TITLES[puzzle.entry];
  if (!entry) throw new Error(`Title ${puzzle.entry} isn't in the list`);
  const [, title, author] = entry;
  return { title, author, words: titleWords(title) };
}
