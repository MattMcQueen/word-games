import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createDictionary } from '../../core/dictionary.ts';
import { contextFor, generateDaily } from '../../core/game.ts';
import { createRng } from '../../core/rng.ts';
import type { LineBank, SentenceBank } from '../../core/sentences.ts';
import { makeCode } from './generate.ts';
import { cipherLogic } from './logic.ts';
import {
  type CipherData,
  clearLetter,
  describeOutcome,
  emptyData,
  hintTarget,
  isCracked,
  placedCount,
  placeLetter,
  resultFor,
  revealLetter,
  shareLines,
  wrongCount,
} from './scoring.ts';
import { acceptCipher } from './solve.ts';
import { type CipherPuzzle, type CipherSolution, codeLetters } from './spec.ts';

const lines = JSON.parse(readFileSync('public/data/cipher-lines.json', 'utf8')) as LineBank;
const dict = createDictionary('cat');

describe('the line bank', () => {
  it('has years of lines, none of them a Lost for Words sentence', () => {
    const bank = JSON.parse(readFileSync('public/data/sentences.json', 'utf8')) as SentenceBank;
    const lfw = new Set(bank.entries.map((e) => e.before + e.word + e.after));
    expect(lines.lines.length).toBeGreaterThan(3 * 365);
    expect(lines.lines.filter((l) => lfw.has(l.text))).toEqual([]);
  });
});

describe('generateCipher', () => {
  it('makes a code that swaps every letter for a different one', () => {
    const code = makeCode(createRng('test'));
    const letters = Object.keys(code);
    expect(letters).toHaveLength(26);
    expect(new Set(Object.values(code)).size).toBe(26);
    expect(letters.every((ch) => code[ch] !== ch)).toBe(true);
  });

  it('codes the day’s line so it decodes letter for letter, keeping punctuation', () => {
    const { puzzle, solution } = generateDaily(
      cipherLogic,
      contextFor(dict, '2027-01-01', { lines }),
    );
    expect(acceptCipher(puzzle, solution)).toBe(true);
    expect(puzzle.coded.replace(/[a-z]/g, '')).toBe(solution.line.replace(/[A-Za-z]/g, ''));
    expect(lines.lines[puzzle.entry]?.text).toBe(solution.line);
    expect(puzzle.book).toEqual(lines.books[lines.lines[puzzle.entry]?.b ?? -1]);
  });

  it("doesn't repeat a line until the bank has been used", () => {
    const seen = new Set<number>();
    for (let d = 0; d < 200; d++) {
      const ctx = { ...contextFor(dict, '2027-01-01', { lines }), dayIndex: d };
      seen.add(generateDaily(cipherLogic, ctx).puzzle.entry);
    }
    expect(seen.size).toBe(200);
  });

  it('needs the line bank', () => {
    expect(() => generateDaily(cipherLogic, contextFor(dict, '2027-01-01'))).toThrow(/line bank/);
  });
});

describe('Cipher scoring', () => {
  // "Cat sat." coded with c→x, a→q, t→z, s→w.
  const puzzle: CipherPuzzle = {
    entry: 0,
    coded: 'xqz wqz.',
    book: { id: 1, title: 'A Book', author: 'An Author' },
  };
  const solution: CipherSolution = { line: 'Cat sat.', key: { x: 'c', q: 'a', z: 't', w: 's' } };
  const place = (data: CipherData, code: string, letter: string) => {
    const outcome = placeLetter(data, code, letter);
    if ('problem' in outcome) throw new Error(outcome.problem);
    return outcome.data;
  };

  it('lists the code letters in reading order', () => {
    expect(codeLetters(puzzle.coded)).toEqual(['x', 'q', 'z', 'w']);
  });

  it('places letters, moving a letter that was used elsewhere', () => {
    let data = place(emptyData(), 'x', 'c');
    data = place(data, 'q', 'c');
    expect(data.guesses).toEqual({ q: 'c' });
    expect(placedCount(puzzle, data)).toBe(1);
    expect(clearLetter(data, 'q').guesses).toEqual({});
  });

  it('counts wrong letters, and is cracked only when all are right', () => {
    let data = place(emptyData(), 'x', 'c');
    data = place(data, 'q', 'a');
    data = place(data, 'z', 's');
    data = place(data, 'w', 't');
    expect(wrongCount(puzzle, solution, data)).toBe(2);
    expect(isCracked(puzzle, solution, data)).toBe(false);
    data = place(place(data, 'z', 't'), 'w', 's');
    expect(isCracked(puzzle, solution, data)).toBe(true);
  });

  it('hints give away the chosen letter, or the next wrong one, and then lock it', () => {
    const data = place(emptyData(), 'x', 'c');
    expect(hintTarget(puzzle, solution, data, 'z')).toBe('z');
    expect(hintTarget(puzzle, solution, data, 'x')).toBe('q');
    const hinted = revealLetter(place(data, 'w', 't'), solution, 'z');
    expect(hinted.guesses).toEqual({ x: 'c', z: 't' });
    expect(hinted.revealed).toEqual(['z']);
    expect(placeLetter(hinted, 'z', 'e')).toEqual({
      problem: "Z was given away, so it can't change.",
    });
    expect(placeLetter(hinted, 'w', 't')).toEqual({ problem: 'T was given away for Z.' });
    expect(clearLetter(hinted, 'z')).toBe(hinted);
  });

  it('scores letters cracked without hints, perfect only with none', () => {
    const all: CipherData = { guesses: { ...solution.key }, revealed: [] };
    expect(resultFor(puzzle, solution, all, false)).toEqual({
      score: 4,
      best: 4,
      perfect: true,
      gaveUp: false,
    });
    expect(describeOutcome(puzzle, solution, all)).toBe(
      'You cracked the code without a single hint!',
    );
    expect(shareLines(puzzle, solution, all)).toEqual(['🔐 ⭐ Cracked, no hints']);

    const helped: CipherData = { guesses: { ...solution.key }, revealed: ['q'] };
    expect(resultFor(puzzle, solution, helped, false).score).toBe(3);
    expect(describeOutcome(puzzle, solution, helped)).toBe('You cracked the code, with 1 hint.');
    expect(shareLines(puzzle, solution, helped)).toEqual([
      '🔐 Cracked with 1 hint, 3 of 4 letters unaided',
    ]);

    const partway: CipherData = { guesses: { x: 'c', q: 'e' }, revealed: [] };
    expect(resultFor(puzzle, solution, partway, true)).toEqual({
      score: 1,
      best: 4,
      perfect: false,
      gaveUp: true,
    });
    expect(describeOutcome(puzzle, solution, partway)).toBe('You had 1 of the 4 letters right.');
    expect(shareLines(puzzle, solution, partway)).toEqual(['🔐 1 of 4 letters']);
    expect(describeOutcome(puzzle, solution, emptyData())).toBe(
      "You didn't crack any of the code.",
    );
  });
});
