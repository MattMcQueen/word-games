import { describe, expect, it } from 'vitest';
import { describeLongest, longestOf, longestResult, shareLongest } from './longest.ts';

describe('longest-word scoring', () => {
  it('picks and scores the longest word', () => {
    expect(longestOf(['cat', 'horse', 'zebra'])).toBe('horse');
    expect(longestResult(['cat', 'horse'], 5, false)).toEqual({
      score: 5,
      best: 5,
      perfect: true,
      gaveUp: false,
    });
    expect(longestResult(['cat'], 5, true)).toMatchObject({
      score: 3,
      perfect: false,
      gaveUp: true,
    });
  });

  it('describes and shares the outcome without the words', () => {
    expect(describeLongest(null, 5, 'with J')).toBe(
      "You didn't find a word with J. The longest has 5 letters.",
    );
    expect(describeLongest('cat', 5, 'with J')).toBe(
      "You didn't find the longest word. Yours had 3 letters; the longest has 5.",
    );
    expect(describeLongest('horse', 5, 'with J')).toBe('You found the longest word: 5 letters!');
    expect(shareLongest('🎹', ['cat', 'dog'], 5)).toEqual([
      '🎹 Longest: 3 letters (best 5)',
      '🟩🟩🟩⬜⬜',
      'Words found: 2',
    ]);
    expect(shareLongest('🎹', ['horse'], 5)[0]).toBe('🎹 ⭐ 5 letters, the longest possible');
  });
});
