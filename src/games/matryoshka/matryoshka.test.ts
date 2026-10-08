import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { contextFor, generateDaily } from '../../core/game.ts';
import { createRng } from '../../core/rng.ts';
import { acceptMatryoshka, generateMatryoshka } from './generate.ts';
import { matryoshkaLogic } from './logic.ts';
import { chainLabel, describeOutcome, nextProblem, resultFor, shareLines } from './scoring.ts';
import { nextWords, solveMatryoshka } from './solve.ts';
import { insertedAt, isOneLetterInsertion, MAX_CHAIN, MIN_CHAIN, MIN_FIRST_STEPS } from './spec.ts';

const small = createDictionary(
  ['acts', 'cat', 'chat', 'chats', 'chants', 'cats', 'coat', 'scat'].join('\n'),
);
const ctx = contextFor(small, '2026-10-08');

describe('Matryoshka rules', () => {
  it('recognises a single inserted letter', () => {
    expect(isOneLetterInsertion('cat', 'chat')).toBe(true);
    expect(isOneLetterInsertion('cat', 'cats')).toBe(true);
    expect(isOneLetterInsertion('cat', 'scat')).toBe(true);
    expect(isOneLetterInsertion('cat', 'acts')).toBe(false); // letters moved
    expect(isOneLetterInsertion('cat', 'chats')).toBe(false); // two letters added
  });

  it('finds where the new letter went', () => {
    expect(insertedAt('cat', 'chat')).toBe(1);
    expect(insertedAt('cat', 'cats')).toBe(3);
    expect(insertedAt('cat', 'scat')).toBe(0);
  });
});

describe('solveMatryoshka', () => {
  it('lists the words one letter longer', () => {
    expect(nextWords('cat', small)).toEqual(['cats', 'chat', 'coat', 'scat']);
  });

  it('finds the longest chain and example chains', () => {
    // at → cat → cats/chat → chats → chants (4); acts can't be reached.
    const solution = solveMatryoshka({ seed: 'at' }, ctx);
    expect(solution.best).toBe(4);
    expect(solution.firstSteps).toBe(1);
    expect(solution.chains).toEqual([['cat', 'cats', 'chats', 'chants']]); // first found, alphabetically
  });

  it('reports a dead seed', () => {
    expect(solveMatryoshka({ seed: 'zz' }, ctx)).toEqual({ best: 0, firstSteps: 0, chains: [] });
  });
});

describe('generateMatryoshka', () => {
  const dict = createDictionary(readFileSync('public/data/words.txt', 'utf8'));

  it('makes 2- or 3-letter seeds', () => {
    const rng = createRng('seeds');
    for (let i = 0; i < 50; i++) {
      const p = generateMatryoshka(rng, contextFor(dict, '2026-10-08'));
      expect(p?.seed).toMatch(/^[a-z]{2,3}$/);
    }
  });

  it('rejects chains that are too short, too long or forced', () => {
    const sol = (best: number, firstSteps = 5) => ({ best, firstSteps, chains: [] });
    const p = { seed: 'at' };
    expect(acceptMatryoshka(p, sol(MIN_CHAIN - 1))).toBe(false);
    expect(acceptMatryoshka(p, sol(MIN_CHAIN))).toBe(true);
    expect(acceptMatryoshka(p, sol(MAX_CHAIN))).toBe(true);
    expect(acceptMatryoshka(p, sol(MAX_CHAIN + 1))).toBe(false);
    expect(acceptMatryoshka(p, sol(MIN_CHAIN, MIN_FIRST_STEPS - 1))).toBe(false);
  });

  it('produces daily puzzles whose example chains are valid and longest', () => {
    for (let d = 1; d <= 15; d++) {
      const date = `2027-07-${String(d).padStart(2, '0')}`;
      const { puzzle, solution } = generateDaily(matryoshkaLogic, contextFor(dict, date));
      expect(solution.best).toBeGreaterThanOrEqual(MIN_CHAIN);
      expect(solution.best).toBeLessThanOrEqual(MAX_CHAIN);
      expect(solution.chains.length).toBeGreaterThan(0);
      for (const chain of solution.chains) {
        expect(chain).toHaveLength(solution.best);
        let previous = puzzle.seed;
        for (const word of chain) {
          expect(dict.has(word)).toBe(true);
          expect(isOneLetterInsertion(previous, word)).toBe(true);
          previous = word;
        }
      }
    }
  });
});

describe('Matryoshka scoring', () => {
  const solution = { best: 4, firstSteps: 1, chains: [['cat', 'chat', 'chats', 'chants']] };

  it('checks the next word', () => {
    expect(nextProblem('chat', 'cat', small)).toBeNull();
    expect(nextProblem('chats', 'cat', small)).toBe('Add exactly one letter to CAT.');
    expect(nextProblem('acts', 'cat', small)).toBe("ACTS isn't CAT with one letter added.");
    expect(nextProblem('cbat', 'cat', small)).toBe("CBAT isn't in the word list.");
  });

  it('scores the longest chain', () => {
    expect(resultFor(['cat', 'chat'], solution, true)).toEqual({
      score: 2,
      best: 4,
      perfect: false,
      gaveUp: true,
    });
    expect(resultFor(solution.chains[0] as string[], solution, false).perfect).toBe(true);
  });

  it('describes and shares the outcome without the words', () => {
    expect(chainLabel(['at', 'cat'])).toBe('AT → CAT');
    expect(describeOutcome(0, 4)).toBe(
      "You didn't add a word; the longest possible chain was 4 words.",
    );
    expect(describeOutcome(2, 4)).toBe(
      'Your longest chain had 2 words; the longest possible was 4 words.',
    );
    expect(describeOutcome(4, 4)).toBe('Your chain had 4 words: the longest possible!');
    expect(shareLines(2, 4)).toEqual(['🪆 Chain of 2 (best 4)', '🟩🟩🟩⬜⬜']);
    expect(shareLines(4, 4)[0]).toBe('🪆 ⭐ Chain of 4, the longest possible');
  });
});
