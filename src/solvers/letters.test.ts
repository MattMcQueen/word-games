import { describe, expect, it } from 'vitest';
import {
  canSpell,
  containsInOrder,
  letterCounts,
  sortedLetters,
  subtractLetters,
} from './letters.ts';

describe('letter helpers', () => {
  it('sorts letters', () => {
    expect(sortedLetters('banana')).toBe('aaabnn');
  });

  it('counts letters', () => {
    const counts = letterCounts('banana');
    expect(counts[0]).toBe(3); // a
    expect(counts[1]).toBe(1); // b
    expect(counts[13]).toBe(2); // n
  });

  it('checks whether a word can be spelt from a pool', () => {
    const pool = letterCounts('aabnt');
    expect(canSpell('ant', pool)).toBe(true);
    expect(canSpell('banana', pool)).toBe(false);
    expect(canSpell('tab', pool)).toBe(true);
  });

  it('subtracts a word from a pool without mutating it', () => {
    const pool = letterCounts('aabnt');
    const rest = subtractLetters(pool, 'tab');
    expect(rest).toEqual(letterCounts('an'));
    expect(pool).toEqual(letterCounts('aabnt'));
  });

  it('checks for letters in order', () => {
    expect(containsInOrder('rant', 'rnt')).toBe(true);
    expect(containsInOrder('return', 'rnt')).toBe(false);
    expect(containsInOrder('anything', '')).toBe(true);
  });
});
