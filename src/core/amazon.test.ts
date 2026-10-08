import { describe, expect, it } from 'vitest';
import { AFFILIATE_REL, bookSearchUrl } from './amazon.ts';

describe('Amazon book links', () => {
  it('searches Books for the main title and first author, with the tag', () => {
    expect(bookSearchUrl('Frankenstein; or, the Modern Prometheus', 'Mary Shelley', 'abc-21')).toBe(
      'https://www.amazon.co.uk/s?k=Frankenstein+Mary+Shelley&i=stripbooks&tag=abc-21',
    );
    expect(bookSearchUrl('Jane Eyre: An Autobiography', 'Charlotte Brontë', 'abc-21')).toContain(
      'k=Jane+Eyre+Charlotte+Bront%C3%AB',
    );
  });

  it('gives no link without a tag', () => {
    expect(bookSearchUrl('Emma', 'Jane Austen', '')).toBeNull();
  });

  it('marks links as paid', () => {
    expect(AFFILIATE_REL).toContain('sponsored');
  });
});
