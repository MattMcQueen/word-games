import { describe, expect, it } from 'vitest';
import { bestWord } from './best-word.ts';

const longer = (a: string, b: string) => a.length - b.length;

describe('bestWord', () => {
  it('returns null for no words', () => {
    expect(bestWord([], longer)).toBeNull();
  });

  it('picks the best, keeping the first of equals', () => {
    expect(bestWord(['cat', 'horse', 'zebra', 'ox'], longer)).toBe('horse');
  });
});
