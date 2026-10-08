import { describe, expect, it } from 'vitest';
import { keySteps } from './qwerty.ts';

describe('keySteps', () => {
  it('counts touching keys as one hop', () => {
    expect(keySteps('s', 'd')).toBe(1); // same row
    expect(keySteps('s', 'w')).toBe(1); // up-left
    expect(keySteps('s', 'e')).toBe(1); // up-right
    expect(keySteps('s', 'z')).toBe(1); // down-left
    expect(keySteps('s', 'x')).toBe(1); // down-right
  });

  it('measures longer hops', () => {
    expect(keySteps('s', 's')).toBe(0);
    expect(keySteps('q', 'e')).toBe(2);
    expect(keySteps('e', 'a')).toBe(2);
    expect(keySteps('q', 'p')).toBe(9);
    expect(keySteps('q', 'm')).toBe(8); // two rows down, then six keys across
  });

  it('is symmetric', () => {
    for (const [a, b] of [
      ['a', 'm'],
      ['t', 'v'],
      ['p', 'z'],
    ] as const) {
      expect(keySteps(a, b)).toBe(keySteps(b, a));
    }
  });
});
