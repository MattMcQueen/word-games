import { describe, expect, it } from 'vitest';
import { filterWords, parseBlocklist } from './word-filter.ts';

describe('parseBlocklist', () => {
  it('ignores comments and blank lines and lowercases entries', () => {
    const list = parseBlocklist('# heading\nBadword\n\n  other  # trailing comment\n');
    expect([...list]).toEqual(['badword', 'other']);
  });
});

describe('filterWords', () => {
  it('keeps only lowercase a–z words of three or more letters', () => {
    const raw = ['cat', 'Cat', 'London', "don't", 'café', 'at', 'naïve', 'zebra', ' dog ', 'x-ray'];
    expect(filterWords(raw, new Set())).toEqual(['cat', 'dog', 'zebra']);
  });

  it('removes blocklisted words, de-duplicates and sorts', () => {
    expect(filterWords(['zebra', 'bad', 'apple', 'zebra'], new Set(['bad']))).toEqual([
      'apple',
      'zebra',
    ]);
  });
});
