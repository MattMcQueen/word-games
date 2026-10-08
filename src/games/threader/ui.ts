/**
 * Threader's board: the thread shown as tiles, and a live preview that marks
 * which letters of the word being typed make up the thread, on top of the
 * shared word-hunt board. The rules themselves live in scoring.ts.
 */

import { puzzleNumber } from '../../core/date.ts';
import { buildShareText } from '../../core/share.ts';
import { letters } from '../../core/text.ts';
import { type Child, h, replaceChildren } from '../../ui/dom.ts';
import type { GameModule } from '../../ui/game-shell.ts';
import { answersSummary } from '../../ui/results.ts';
import { mountWordHunt, type WordHuntData } from '../../ui/word-hunt.ts';
import { gameUrl } from '../catalogue.ts';
import { threaderLogic } from './logic.ts';
import {
  describeOutcome,
  resultFor,
  shareLines,
  shortestOf,
  threadPositions,
  threadProblem,
} from './scoring.ts';
import {
  compareThreaded,
  NAME,
  SLUG,
  type ThreaderPuzzle,
  type ThreaderSolution,
  threadInWords,
} from './spec.ts';
import './threader.css';

const ORDINALS = ['1st', '2nd', '3rd', '4th'];

/** The thread as tiles with arrows between, read out as "R, then N, then T". */
function threadTiles(thread: string): HTMLElement {
  const tiles = [...thread.toUpperCase()].flatMap((ch, i) => [
    i > 0 ? h('span', { class: 'th-arrow', 'aria-hidden': 'true' }, '→') : null,
    h('span', { class: 'th-tile', 'aria-hidden': 'true' }, ch),
  ]);
  const spoken = [...thread.toUpperCase()].join(', then ');
  return h('p', { class: 'th-thread' }, h('span', { class: 'sr-only' }, spoken), tiles);
}

/** The word being typed, with the thread's letters marked (underlined and bold, not just coloured). */
function preview(word: string, thread: string): Child[] {
  if (!word) return [document.createTextNode('Type a word to see the thread in it')];
  const hits = new Set(threadPositions(word, thread));
  const complete = hits.size === thread.length;
  return [
    h(
      'span',
      { class: 'th-preview' },
      [...word.toUpperCase()].map((ch, i) =>
        h('span', { class: hits.has(i) ? 'th-hit' : null }, ch),
      ),
    ),
    ` ${complete ? '✓ all in order' : `needs ${[...thread.slice(hits.size).toUpperCase()].join(', ')}`}`,
  ];
}

export const threaderGame: GameModule<ThreaderPuzzle, ThreaderSolution, WordHuntData> = {
  logic: threaderLogic,
  name: NAME,
  initialData: () => ({ words: [] }),

  mount(ctx) {
    const { puzzle, solution, dict } = ctx;
    const thread = puzzle.letters;

    const bestLine = h('p', { class: 'best-line' });
    const previewLine = h('p', { class: 'live-line', 'aria-hidden': 'true' });
    const showPreview = (word: string) => {
      replaceChildren(previewLine, preview(word, thread));
      previewLine.dataset.warn = 'false';
    };
    showPreview('');

    const { keyboard } = mountWordHunt({
      ctx,
      top: [
        h(
          'section',
          { class: 'panel th-panel', 'aria-label': 'Thread' },
          h('p', { class: 'th-label' }, 'Find the shortest word containing, in this order:'),
          threadTiles(thread),
          bestLine,
        ),
      ],
      belowInput: [previewLine],
      onType: showPreview,
      problem: (word, found) => threadProblem(word, puzzle, dict, found),
      compare: compareThreaded,
      describe: (w) => letters(w.length),
      accepted: (w, isNewBest) =>
        `${w.toUpperCase()}: ${letters(w.length)}.${isNewBest ? ' Your shortest yet!' : ''}`,
      result: (words, gaveUp) => resultFor(words, solution, gaveUp),
      onRender: (best) => {
        bestLine.textContent = best
          ? `Your shortest: ${best.toUpperCase()} · ${letters(best.length)}`
          : `No words yet. ${solution.total} words contain ${threadInWords(thread)} in order.`;
      },
    });

    // Mark the thread's letters on the keyboard, saying where each comes in it.
    const places = new Map<string, string[]>();
    for (const [i, ch] of [...thread].entries()) {
      places.set(ch, [...(places.get(ch) ?? []), ORDINALS[i] ?? '']);
    }
    for (const [ch, order] of places)
      keyboard.setKey(ch, { highlight: true, hint: order.join('&') });
  },

  summarise({ puzzle, solution, data, result, date }) {
    return {
      detail: describeOutcome(shortestOf(data.words), solution, puzzle.letters),
      ...answersSummary(solution.answers),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLines(data.words, solution, result.perfect),
        url: gameUrl(SLUG),
      }),
    };
  },
};
