/**
 * Keyhop's player-facing rules: checking a guess against the day's start key,
 * minimum length and reach. Scoring and wording are shared with Lockout
 * (core/longest.ts). Pure functions, unit tested; ui.ts wires them up.
 */

import type { Dictionary } from '../../core/dictionary.ts';
import { basicWordProblem } from '../../core/validate.ts';
import { firstBadHop, type KeyhopPuzzle } from './spec.ts';

/** "within 2 keys" */
export const reachText = (reach: number) => `within ${reach} keys`;

/** Why a guess can't be accepted, or null if it can. */
export function hopProblem(
  word: string,
  puzzle: KeyhopPuzzle,
  dict: Dictionary,
  found: readonly string[],
): string | null {
  const basic = basicWordProblem(word, dict, found);
  if (basic) return basic;
  if (!word.startsWith(puzzle.start))
    return `Words start with ${puzzle.start.toUpperCase()} today.`;
  if (word.length < puzzle.minLength)
    return `Words need at least ${puzzle.minLength} letters today.`;
  const bad = firstBadHop(word, puzzle.reach);
  if (bad !== -1) {
    const from = (word[bad - 1] as string).toUpperCase();
    const to = (word[bad] as string).toUpperCase();
    return `${from} to ${to} is too far: each letter must be ${reachText(puzzle.reach)} of the one before.`;
  }
  return null;
}
