import { describe, expect, it } from 'vitest';
import { isLiveSite } from './analytics.ts';

describe('isLiveSite', () => {
  it('counts the live address', () => {
    expect(isLiveSite('words.matt-rarely-writes.co.uk')).toBe(true);
  });

  it("never counts local previews, the tests or Azure's own address", () => {
    expect(isLiveSite('localhost')).toBe(false);
    expect(isLiveSite('127.0.0.1')).toBe(false);
    expect(isLiveSite('gentle-sea-0123.2.azurestaticapps.net')).toBe(false);
  });

  it('is not fooled by a look-alike address', () => {
    expect(isLiveSite('matt-rarely-writes.co.uk.example.com')).toBe(false);
    expect(isLiveSite('evil-matt-rarely-writes.co.uk')).toBe(false);
  });
});
