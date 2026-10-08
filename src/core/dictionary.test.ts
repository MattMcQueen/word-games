import { describe, expect, it } from 'vitest';
import { createDictionary } from './dictionary.ts';

const dict = createDictionary('act\ncat\nscat\ntac\nzebra\r\n\n');

describe('createDictionary', () => {
  it('parses one word per line, tolerating CRLF and blank lines', () => {
    expect(dict.words).toEqual(['act', 'cat', 'scat', 'tac', 'zebra']);
  });

  it('looks words up', () => {
    expect(dict.has('cat')).toBe(true);
    expect(dict.has('dog')).toBe(false);
  });

  it('groups words by length', () => {
    expect(dict.ofLength(3)).toEqual(['act', 'cat', 'tac']);
    expect(dict.ofLength(9)).toEqual([]);
  });

  it('finds anagrams', () => {
    expect(dict.anagramsOf('tca')).toEqual(['act', 'cat', 'tac']);
    expect(dict.anagramsOf('xyz')).toEqual([]);
  });
});
