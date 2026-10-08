/**
 * Keyhop's board: the on-screen keyboard is the board. Before you type, only
 * the starting key is lit; after each letter, the keys within reach light up
 * and the rest are switched off. Built on the shared word-hunt board.
 */

import { puzzleNumber } from '../../core/date.ts';
import {
  describeLongest,
  longerWins,
  longestOf,
  longestResult,
  shareLongest,
} from '../../core/longest.ts';
import { buildShareText } from '../../core/share.ts';
import { letters } from '../../core/text.ts';
import { ALPHABET } from '../../solvers/letters.ts';
import { h } from '../../ui/dom.ts';
import type { GameModule } from '../../ui/game-shell.ts';
import { answersSummary } from '../../ui/results.ts';
import { mountWordHunt, type WordHuntData } from '../../ui/word-hunt.ts';
import { gameUrl } from '../catalogue.ts';
import { keyhopLogic } from './logic.ts';
import { hopProblem, reachText } from './scoring.ts';
import { canHop, type KeyhopPuzzle, type KeyhopSolution, NAME, SLUG } from './spec.ts';
import './keyhop.css';

export const keyhopGame: GameModule<KeyhopPuzzle, KeyhopSolution, WordHuntData> = {
  logic: keyhopLogic,
  name: NAME,
  initialData: () => ({ words: [] }),

  mount(ctx) {
    const { puzzle, solution, dict } = ctx;
    const S = puzzle.start.toUpperCase();
    const bestLine = h('p', { class: 'best-line' });
    const nextLine = h('p', { class: 'live-line', 'aria-live': 'polite' });

    const reachable = (typed: string, letter: string) =>
      typed === '' ? letter === puzzle.start : canHop(typed.at(-1) as string, letter, puzzle.reach);

    const board = mountWordHunt({
      ctx,
      top: [
        h(
          'section',
          { class: 'panel kh-panel', 'aria-label': "Today's rules" },
          h(
            'ul',
            { class: 'kh-rules' },
            h('li', null, h('span', { class: 'kh-key' }, S), ` Start on ${S}`),
            h('li', null, h('span', { class: 'kh-chip' }, `${puzzle.reach} keys`), ' Each hop'),
            h('li', null, h('span', { class: 'kh-chip' }, `${puzzle.minLength}+`), ' Letters'),
          ),
          h(
            'p',
            { class: 'kh-explain' },
            `Each letter must be ${reachText(puzzle.reach)} of the one before. The same key twice is fine.`,
          ),
          bestLine,
        ),
      ],
      belowInput: [nextLine],
      allowLetter: reachable,
      onType: (typed) => showKeys(typed),
      problem: (word, found) => hopProblem(word, puzzle, dict, found),
      compare: longerWins,
      describe: (w) => letters(w.length),
      accepted: (w, isNewBest) =>
        `${w.toUpperCase()}: ${letters(w.length)}.${isNewBest ? ' Your longest yet!' : ''}`,
      result: (words, gaveUp) => longestResult(words, solution.bestLength, gaveUp),
      onRender: (best) => {
        bestLine.textContent = best
          ? `Your longest: ${best.toUpperCase()} · ${letters(best.length)}`
          : `No words yet. There are ${solution.total} to find.`;
      },
    });

    /** Light the keys within reach of the last letter typed, and switch the rest off. */
    function showKeys(typed: string) {
      const last = typed.at(-1);
      let count = 0;
      for (const letter of ALPHABET) {
        const ok = reachable(typed, letter);
        if (ok) count++;
        const hint =
          letter === last ? 'last' : letter === puzzle.start && !typed ? 'start' : undefined;
        board.keyboard.setKey(letter, { disabled: !ok, highlight: ok, ...(hint ? { hint } : {}) });
      }
      nextLine.textContent = last
        ? `${count} keys within reach of ${last.toUpperCase()}`
        : `Start on ${S}`;
    }
    showKeys('');
  },

  summarise({ solution, data, date }) {
    return {
      detail: describeLongest(longestOf(data.words), solution.bestLength),
      ...answersSummary(solution.answers),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLongest('🎹', data.words, solution.bestLength),
        url: gameUrl(SLUG),
      }),
    };
  },
};
