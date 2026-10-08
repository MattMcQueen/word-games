import { describe, expect, it } from 'vitest';
import { toyGame } from '../test/toy-game.ts';
import { createDictionary } from './dictionary.ts';
import { contextFor, generateDaily } from './game.ts';

const dict = createDictionary('ant\nbee\ncat\ndog\nemu');

describe('generateDaily', () => {
  it('is deterministic for a given date', () => {
    const a = generateDaily(toyGame, contextFor(dict, '2026-10-08'));
    const b = generateDaily(toyGame, contextFor(dict, '2026-10-08'));
    expect(a).toEqual(b);
  });

  it('only returns accepted puzzles', () => {
    for (let d = 1; d <= 28; d++) {
      const date = `2026-02-${String(d).padStart(2, '0')}`;
      const { puzzle } = generateDaily(toyGame, contextFor(dict, date));
      expect(['bee', 'cat', 'dog']).toContain(puzzle.word);
    }
  });

  it('fails loudly if nothing is ever accepted', () => {
    const impossible = { ...toyGame, accept: () => false };
    expect(() => generateDaily(impossible, contextFor(dict, '2026-10-08'))).toThrow(
      /no acceptable/,
    );
  });

  it('supplies the day index since launch', () => {
    expect(contextFor(dict, '2026-10-01').dayIndex).toBe(0);
    expect(contextFor(dict, '2026-10-08').dayIndex).toBe(7);
  });
});
