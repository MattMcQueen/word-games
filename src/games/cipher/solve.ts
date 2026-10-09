/** Cipher "solver": the line, looked up from the bank, and the key that decodes it. */

import type { GenerateContext } from '../../core/game.ts';
import { type CipherPuzzle, type CipherSolution, isLetter } from './spec.ts';

export function solveCipher(puzzle: CipherPuzzle, ctx: GenerateContext): CipherSolution {
  const line = ctx.lines?.lines[puzzle.entry]?.text;
  if (line === undefined) throw new Error(`Line ${puzzle.entry} isn't in the bank`);
  const plain = line.toLowerCase();
  const key: Record<string, string> = {};
  [...puzzle.coded].forEach((ch, i) => {
    if (isLetter(ch)) key[ch] = plain[i] as string;
  });
  return { line, key };
}

/** A puzzle is fair if the line decodes letter for letter. */
export function acceptCipher(puzzle: CipherPuzzle, solution: CipherSolution): boolean {
  const decoded = [...puzzle.coded].map((ch) => (isLetter(ch) ? solution.key[ch] : ch)).join('');
  return decoded === solution.line.toLowerCase();
}
