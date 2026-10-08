import { describe, expect, it } from 'vitest';
import { createDictionary } from './dictionary.ts';
import { basicWordProblem } from './validate.ts';

const dict = createDictionary('cat\ndog');

describe('basicWordProblem', () => {
  it('accepts a new dictionary word', () => {
    expect(basicWordProblem('cat', dict, ['dog'])).toBeNull();
  });

  it('rejects short, unknown and repeated words', () => {
    expect(basicWordProblem('ca', dict)).toBe('Words need at least 3 letters.');
    expect(basicWordProblem('cow', dict)).toBe("COW isn't in the word list.");
    expect(basicWordProblem('cat', dict, ['cat'])).toBe("You've already found CAT.");
  });
});
