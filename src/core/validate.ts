/** Checks shared by every game that accepts typed words. */

import type { Dictionary } from './dictionary.ts';

const MIN_WORD_LENGTH = 3;

/**
 * The usual reasons to reject a guess: too short, not in the word list, or
 * already found. Returns a message for the player, or null if the word passes.
 */
export function basicWordProblem(
  word: string,
  dict: Dictionary,
  found: readonly string[] = [],
): string | null {
  if (word.length < MIN_WORD_LENGTH) return `Words need at least ${MIN_WORD_LENGTH} letters.`;
  if (!dict.has(word)) return `${word.toUpperCase()} isn't in the word list.`;
  if (found.includes(word)) return `You've already found ${word.toUpperCase()}.`;
  return null;
}
