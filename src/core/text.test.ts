import { describe, expect, it } from 'vitest';
import { letters, plural } from './text.ts';

describe('wording helpers', () => {
  it('pluralises', () => {
    expect(letters(1)).toBe('1 letter');
    expect(letters(7)).toBe('7 letters');
    expect(plural(2, 'pair')).toBe('2 pairs');
    expect(plural(3, 'match', 'matches')).toBe('3 matches');
  });
});
