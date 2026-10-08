/**
 * Small letter-counting helpers shared by several solvers and generators.
 * Words are always lowercase a–z.
 */

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

const A = 97; // char code of 'a'

/** The letters of a word in alphabetical order: "cat" → "act". */
export const sortedLetters = (word: string) => [...word].sort().join('');

/** Count of each letter a–z, as a 26-slot array. */
export function letterCounts(word: string): Uint8Array {
  const counts = new Uint8Array(26);
  for (let i = 0; i < word.length; i++) counts[word.charCodeAt(i) - A]!++;
  return counts;
}

/** True if `word` can be spelt using no more of each letter than `available` holds. */
export function canSpell(word: string, available: Uint8Array): boolean {
  const used = new Uint8Array(26);
  for (let i = 0; i < word.length; i++) {
    const c = word.charCodeAt(i) - A;
    if (++used[c]! > available[c]!) return false;
  }
  return true;
}

/** Remove a word's letters from a count array, returning a new array. Assumes canSpell. */
export function subtractLetters(available: Uint8Array, word: string): Uint8Array {
  const out = available.slice();
  for (let i = 0; i < word.length; i++) out[word.charCodeAt(i) - A]!--;
  return out;
}

/** True if `word` contains every letter of `sequence` in order, not necessarily adjacent. */
export function containsInOrder(word: string, sequence: string): boolean {
  let j = 0;
  for (let i = 0; i < word.length && j < sequence.length; i++) {
    if (word[i] === sequence[j]) j++;
  }
  return j === sequence.length;
}
