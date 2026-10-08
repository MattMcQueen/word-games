/**
 * Lockout's player-facing rules: checking a guess against the required and
 * banned letters. Scoring and wording are in core/longest.ts.
 */

import type { Dictionary } from '../../core/dictionary.ts';
import { basicWordProblem } from '../../core/validate.ts';
import { bannedIn, type LockoutPuzzle } from './spec.ts';

/** "T" / "T and S" / "T, S and R" */
const list = (letters: string[]) => {
  const upper = letters.map((l) => l.toUpperCase());
  return upper.length < 2
    ? (upper[0] ?? '')
    : `${upper.slice(0, -1).join(', ')} and ${upper.at(-1)}`;
};

/** Why a guess can't be accepted, or null if it can. */
export function lockoutProblem(
  word: string,
  puzzle: LockoutPuzzle,
  dict: Dictionary,
  found: readonly string[],
): string | null {
  const basic = basicWordProblem(word, dict, found);
  if (basic) return basic;
  const banned = bannedIn(word, puzzle.banned);
  if (banned.length > 0) {
    return `${word.toUpperCase()} uses ${list(banned)}, which ${banned.length === 1 ? 'is' : 'are'} locked out.`;
  }
  if (!word.includes(puzzle.required))
    return `Words must include ${puzzle.required.toUpperCase()}.`;
  return null;
}
