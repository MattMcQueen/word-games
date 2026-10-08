/**
 * The board shared by "word hunt" games, where you enter as many words as you
 * like and your best one counts (Price Tag, Threader, …). Built on the common
 * word board; a game supplies only its rules: how to check a word, how to rank
 * words, what to say about them, and any extra panels.
 */

import { bestWord, type CompareWords } from '../core/best-word.ts';
import type { GameResult } from '../core/progress.ts';
import type { GameContext } from './game-shell.ts';
import { foundItem, mountWordBoard, type WordBoard } from './word-board.ts';

/** Saved state for a word hunt: the accepted words, in the order found. */
export interface WordHuntData {
  words: string[];
}

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
}

export function mountWordHunt<P, S>(opts: WordHuntOptions<P, S>): WordBoard {
  const data: WordHuntData = { words: [...opts.ctx.data.words] };
  const { words } = data;
  const best = () => bestWord(words, opts.compare);

  return mountWordBoard({
    ctx: opts.ctx as GameContext<unknown, unknown, WordHuntData>,
    data,
    top: opts.top,
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
    result: (gaveUp) => opts.result(words, gaveUp),
    onRender: () => opts.onRender?.(best()),
  });
}
