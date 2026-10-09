/**
 * The board shared by "word hunt" games, where you enter as many words as you
 * like and your best one counts (Price Tag, Threader, …). Built on the common
 * word board; a game supplies only its rules: how to check a word, how to rank
 * words, what to say about them, and any extra panels.
 */

import { bestWord, type CompareWords } from '../core/best-word.ts';
import type { GameResult } from '../core/progress.ts';
import { plural } from '../core/text.ts';
import { h } from './dom.ts';
import type { GameContext } from './game-shell.ts';
import { foundItem, mountWordBoard, type WordBoard } from './word-board.ts';

/** Saved state for a word hunt: the accepted words, in the order found. */
export interface WordHuntData {
  words: string[];
  /** Letters of a best answer revealed by hints (missing in games saved before hints). */
  hints?: number;
}

/** " with 2 letters revealed", for results; empty with no hints. */
export const hintNote = (data: WordHuntData) =>
  data.hints ? ` You had ${plural(data.hints, 'letter')} revealed.` : '';

export interface WordHuntOptions<P, S> {
  ctx: GameContext<P, S, WordHuntData>;
  /** Panels above the word box (the puzzle itself). */
  top: Node[];
  /** Lines under the word box, e.g. a live running cost. Hidden once finished. */
  belowInput?: Node[];
  /** Why a word can't be accepted, or null if it can. */
  problem(word: string, found: readonly string[]): string | null;
  /** How to rank words: positive if a beats b. */
  compare: CompareWords;
  /** Short description for the found list, e.g. "5 letters, 18p". */
  describe(word: string): string;
  /** Message after a word is accepted. */
  accepted(word: string, isNewBest: boolean): string;
  /** Score the words found against the optimum. */
  result(words: readonly string[], gaveUp: boolean): GameResult;
  /** Called whenever the board redraws, with the current best word (or null). */
  onRender?(best: string | null): void;
  /** Extra word box options, e.g. to veto letters or react to typing. */
  allowLetter?(current: string, letter: string): boolean;
  onType?(word: string): void;
  /** A best answer, revealed a letter at a time by the hint button. */
  hintWord: string;
}

export function mountWordHunt<P, S>(opts: WordHuntOptions<P, S>): WordBoard {
  const data: WordHuntData = { words: [...opts.ctx.data.words], hints: opts.ctx.data.hints ?? 0 };
  const { words } = data;
  const best = () => bestWord(words, opts.compare);
  let board: WordBoard | undefined;

  // "Stuck?": reveal a best answer a letter at a time, all but its last letter.
  const word = opts.hintWord;
  const hintLine = h('p', { class: 'hunt-hint-line' });
  const hintButton = h(
    'button',
    {
      class: 'btn quiet hunt-hint-btn',
      type: 'button',
      onclick: () => {
        data.hints = (data.hints ?? 0) + 1;
        board?.input.feedback(`Revealed letter ${data.hints} of a best answer.`);
        board?.commit();
        board?.input.focus();
      },
    },
    'Reveal a letter',
  );
  const hintRow = h('div', { class: 'hunt-hint' }, hintLine, hintButton);

  board = mountWordBoard({
    ctx: opts.ctx as GameContext<unknown, unknown, WordHuntData>,
    data,
    top: [...opts.top, hintRow],
    ...(opts.belowInput ? { belowInput: opts.belowInput } : {}),
    ...(opts.allowLetter ? { allowLetter: opts.allowLetter } : {}),
    ...(opts.onType ? { onType: opts.onType } : {}),
    submit(word, board) {
      const problem = opts.problem(word, words);
      if (problem) return board.input.feedback(problem, 'bad');
      const previous = best();
      words.push(word);
      board.input.setValue('');
      const isNewBest = previous === null || opts.compare(word, previous) > 0;
      board.input.feedback(opts.accepted(word, isNewBest), 'good');
      board.commit();
    },
    found() {
      const top = best();
      const sorted = [...words].sort((a, b) => opts.compare(b, a) || a.localeCompare(b));
      return {
        heading: `Words found: ${words.length}`,
        items: sorted.map((w) => foundItem(w, opts.describe(w), w === top ? '★ Best' : undefined)),
      };
    },
    // Finding a best answer ends the game; it's perfect only without hints.
    result: (gaveUp) => {
      const result = opts.result(words, gaveUp);
      return data.hints ? { ...result, perfect: false } : result;
    },
    done: () => opts.result(words, false).perfect,
    onRender: (finished) => {
      const shown = data.hints ?? 0;
      hintRow.hidden = finished;
      hintLine.textContent = shown
        ? `A best answer starts ${word.slice(0, shown).toUpperCase()}…`
        : 'Stuck? Reveal a best answer a letter at a time.';
      hintButton.disabled = shown >= word.length - 1;
      opts.onRender?.(best());
    },
  });
  return board;
}
