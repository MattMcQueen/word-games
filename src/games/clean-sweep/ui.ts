/**
 * Clean Sweep's board: the letter tiles (used ones crossed off), a Shuffle
 * button, and the words placed so far with a button to take each one back,
 * on the common word board. The keyboard only offers letters still left.
 * The rules themselves live in scoring.ts.
 */

import { puzzleNumber } from '../../core/date.ts';
import { buildShareText } from '../../core/share.ts';
import { letters, plural } from '../../core/text.ts';
import { h, replaceChildren, targetLine } from '../../ui/dom.ts';
import type { GameContext, GameModule } from '../../ui/game-shell.ts';
import { lookUpAll } from '../../ui/results.ts';
import { mountWordBoard, type WordBoard } from '../../ui/word-board.ts';
import { gameUrl } from '../catalogue.ts';
import { cleanSweepLogic } from './logic.ts';
import {
  betterSweep,
  describeOutcome,
  remainingCounts,
  resultFor,
  shareLines,
  sweepProblem,
} from './scoring.ts';
import { type CleanSweepPuzzle, type CleanSweepSolution, NAME, SLUG } from './spec.ts';
import './clean-sweep.css';

interface CleanSweepData {
  /** Words placed in the current sweep. */
  words: string[];
  /** The complete sweep with fewest words so far, or null. */
  best: string[] | null;
  /** Tile order on screen (indexes into the puzzle's letters), changed by Shuffle. */
  order: number[];
}

const A = 97;

export const cleanSweepGame: GameModule<CleanSweepPuzzle, CleanSweepSolution, CleanSweepData> = {
  logic: cleanSweepLogic,
  name: NAME,
  initialData: (puzzle) => ({ words: [], best: null, order: [...puzzle.letters].map((_, i) => i) }),

  mount(ctx) {
    const { puzzle, solution, dict } = ctx;
    const data: CleanSweepData = {
      words: [...ctx.data.words],
      best: ctx.data.best ? [...ctx.data.best] : null,
      order: [...ctx.data.order],
    };
    const left = () => remainingCounts(puzzle.letters, data.words);
    /**
     * How many of each letter are free once `word` is taken out too, going
     * below zero if it uses too many. (A plain number array: the Uint8Array
     * from remainingCounts would wrap round from 0 to 255.)
     */
    const freeAfter = (word: string) => {
      const free = Array.from(left());
      for (const ch of word) free[ch.charCodeAt(0) - A] = (free[ch.charCodeAt(0) - A] ?? 0) - 1;
      return (c: number) => free[c] ?? 0;
    };
    let typed = '';
    let board: WordBoard | undefined;

    const tiles = h('ul', { class: 'cs-tiles', 'aria-label': 'Letters' });
    const status = h('p', { class: 'cs-status' });
    const shuffle = h(
      'button',
      {
        class: 'btn quiet',
        type: 'button',
        onclick: () => {
          for (let i = data.order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [data.order[i], data.order[j]] = [data.order[j] as number, data.order[i] as number];
          }
          board?.commit();
          board?.input.focus();
        },
      },
      'Shuffle',
    );

    /** Draw the tiles: each letter is crossed off once it's used, or while it's being typed. */
    function drawTiles() {
      const free = freeAfter(typed);
      // A letter's tiles are marked used from the last one back, so the free ones stay first.
      const freeSeen = new Uint8Array(26);
      replaceChildren(
        tiles,
        data.order.map((i) => {
          const ch = puzzle.letters[i] as string;
          const c = ch.charCodeAt(0) - A;
          const seen = freeSeen[c] ?? 0;
          const used = seen >= Math.max(free(c), 0);
          freeSeen[c] = seen + 1;
          return h(
            'li',
            { class: used ? 'cs-tile cs-used' : 'cs-tile' },
            ch.toUpperCase(),
            used ? h('span', { class: 'sr-only' }, ' (used)') : null,
          );
        }),
      );
    }

    /** Offer only the letters still free (allowing for what's typed), showing how many of each. */
    function updateKeyboard() {
      if (!board) return;
      const free = freeAfter(typed);
      for (let c = 0; c < 26; c++) {
        const n = Math.max(free(c), 0);
        board.keyboard.setKey(String.fromCharCode(A + c), {
          disabled: n === 0,
          ...(n > 1 ? { hint: `×${n}` } : {}),
        });
      }
    }

    const takeBack = (index: number) => {
      const [word] = data.words.splice(index, 1);
      board?.input.feedback(`${word?.toUpperCase()} taken back.`);
      board?.commit();
      board?.input.focus();
    };

    board = mountWordBoard({
      ctx: ctx as GameContext<unknown, unknown, CleanSweepData>,
      data,
      top: [
        h(
          'section',
          { class: 'panel cs-panel', 'aria-label': 'Letters to sweep' },
          tiles,
          h('div', { class: 'cs-bar' }, status, shuffle),
          targetLine(`every letter in ${plural(solution.min, 'word')}`),
        ),
      ],
      allowLetter: (current, letter) => freeAfter(current + letter)(letter.charCodeAt(0) - A) >= 0,
      onType: (word) => {
        typed = word;
        drawTiles();
        updateKeyboard();
      },
      submit(word, { input, commit }) {
        const problem = sweepProblem(word, left(), dict);
        if (problem) return input.feedback(problem, 'bad');
        data.words.push(word);
        input.setValue('');
        const remaining = left().reduce((a, b) => a + b, 0);
        if (remaining > 0) {
          input.feedback(`${word.toUpperCase()}: ${plural(remaining, 'letter')} to go.`, 'good');
        } else {
          if (betterSweep(data.words, data.best)) data.best = [...data.words];
          const n = data.words.length;
          input.feedback(
            n <= solution.min
              ? `Swept in ${plural(n, 'word')}!`
              : `Every letter swept in ${plural(n, 'word')}! It can be done in fewer: take a word back to try again, or press Finish.`,
            'good',
          );
        }
        commit();
      },
      found: () => ({
        heading: `Words placed: ${data.words.length}`,
        items: data.words.map((w, i) =>
          h(
            'li',
            null,
            h('span', { class: 'found-word' }, w),
            h('span', { class: 'found-meta' }, letters(w.length)),
            // Hidden by onRender once the puzzle is finished.
            h(
              'button',
              {
                class: 'btn quiet cs-take-back',
                type: 'button',
                'aria-label': `Take back ${w.toUpperCase()}`,
                onclick: () => takeBack(i),
              },
              'Take back',
            ),
          ),
        ),
      }),
      result: (gaveUp) => resultFor(data.best, solution, gaveUp),
      onRender(finished) {
        const remaining = left().reduce((a, b) => a + b, 0);
        status.textContent = data.best
          ? `${plural(remaining, 'letter')} left · best sweep so far: ${plural(data.best.length, 'word')}`
          : `${plural(remaining, 'letter')} left`;
        shuffle.hidden = finished;
        for (const button of document.querySelectorAll<HTMLElement>('.cs-take-back')) {
          button.hidden = finished;
        }
        drawTiles();
        updateKeyboard();
      },
    });
    updateKeyboard();
  },

  summarise({ solution, data, date }) {
    return {
      detail: describeOutcome(data.best, solution.min),
      answersLabel: solution.examples.length === 1 ? 'A best sweep' : 'Some best sweeps',
      answers: solution.examples.map((words) => lookUpAll(words.join(' + ').toUpperCase())),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLines(data.best, solution.min),
        url: gameUrl(SLUG),
      }),
    };
  },
};
