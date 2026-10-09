/**
 * Hinge's board: the five pairs, each with a row of boxes for its hinge and a
 * button to reveal a letter, on the common word board. Typing a word and
 * pressing Enter tries it against every unsolved pair. The rules themselves
 * live in scoring.ts.
 */

import { puzzleNumber } from '../../core/date.ts';
import { buildShareText } from '../../core/share.ts';
import { h, replaceChildren } from '../../ui/dom.ts';
import type { GameContext, GameModule } from '../../ui/game-shell.ts';
import { lookUp } from '../../ui/results.ts';
import { foundItem, mountWordBoard, type WordBoard } from '../../ui/word-board.ts';
import { gameUrl } from '../catalogue.ts';
import { hingeLogic } from './logic.ts';
import {
  allSolved,
  describeOutcome,
  emptyData,
  type HingeData,
  matchGuess,
  maxHints,
  resultFor,
  shareLines,
} from './scoring.ts';
import { type HingePair, type HingePuzzle, type HingeSolution, NAME, SLUG } from './spec.ts';
import './hinge.css';

const upper = (s: string) => s.toUpperCase();

/** "CAR, then a 3-letter word, then ROL", for screen readers. */
function spoken(pair: HingePair, shown: string[]): string {
  const letters = shown.map((l) => l.toUpperCase() || 'blank').join(', ');
  return `${upper(pair.left)}, then a ${pair.length}-letter word (${letters}), then ${upper(pair.right)}`;
}

export const hingeGame: GameModule<HingePuzzle, HingeSolution, HingeData> = {
  logic: hingeLogic,
  name: NAME,
  initialData: emptyData,

  mount(ctx) {
    const { puzzle, solution, dict } = ctx;
    const data: HingeData = { found: [...ctx.data.found], hints: [...ctx.data.hints] };
    const list = h('ol', { class: 'hg-pairs' });
    const progress = h('p', { class: 'live-line', 'aria-hidden': 'true' });
    let board: WordBoard | undefined;

    function reveal(i: number) {
      const pair = puzzle.pairs[i] as HingePair;
      if (data.found[i] || (data.hints[i] ?? 0) >= maxHints(pair.length)) return;
      data.hints[i] = (data.hints[i] ?? 0) + 1;
      board?.input.feedback(`Revealed a letter of hinge ${i + 1}.`);
      board?.commit();
      board?.input.focus();
    }

    function row(pair: HingePair, i: number, finished: boolean) {
      const answer = solution.answers[i] as string;
      const found = data.found[i] as string;
      const hints = data.hints[i] ?? 0;
      const showAll = Boolean(found) || finished;
      const shown = [...answer].map((ch, j) => (showAll || j < hints ? ch : ''));
      const state = found ? (hints ? 'helped' : 'found') : finished ? 'missed' : 'open';
      return h(
        'li',
        { class: `hg-pair hg-${state}` },
        h('span', { class: 'sr-only' }, `Hinge ${i + 1}: ${spoken(pair, shown)}.`),
        h(
          'div',
          { class: 'hg-line' },
          h('span', { class: 'hg-word hg-left', 'aria-hidden': 'true' }, upper(pair.left)),
          h(
            'span',
            { class: 'hg-boxes', 'aria-hidden': 'true' },
            shown.map((l) => h('span', { class: 'hg-box' }, upper(l))),
          ),
          h('span', { class: 'hg-word hg-right', 'aria-hidden': 'true' }, upper(pair.right)),
          showAll
            ? null
            : h(
                'button',
                {
                  class: 'hg-hint',
                  type: 'button',
                  disabled: hints >= maxHints(pair.length),
                  'aria-label': `Reveal a letter of hinge ${i + 1}`,
                  title: 'Reveal a letter',
                  onclick: () => reveal(i),
                },
                'Hint',
              ),
        ),
        showAll
          ? h(
              'p',
              { class: 'hg-made' },
              found ? '✓ ' : '',
              `${upper(pair.left + answer)} · ${upper(answer + pair.right)}`,
            )
          : null,
      );
    }

    board = mountWordBoard({
      ctx: ctx as GameContext<unknown, unknown, HingeData>,
      data,
      top: [
        h(
          'section',
          { class: 'panel hg-panel', 'aria-label': "Today's pairs" },
          h(
            'p',
            { class: 'hg-label' },
            'Find the word that finishes the first word and starts the second.',
          ),
          list,
        ),
      ],
      belowInput: [progress],
      allowLetter: (typed) => typed.length < 7,
      submit(guess, { input, commit, end }) {
        const match = matchGuess(guess, puzzle, data, dict);
        if ('problem' in match) return input.feedback(match.problem, 'bad');
        const pair = puzzle.pairs[match.pair] as HingePair;
        data.found[match.pair] = guess;
        input.setValue('');
        input.feedback(`${upper(pair.left + guess)} and ${upper(guess + pair.right)}!`, 'good');
        if (allSolved(data)) return end(false);
        commit();
      },
      found: () => ({
        heading: `Hinges found: ${data.found.filter(Boolean).length} of ${puzzle.pairs.length}`,
        items: puzzle.pairs.flatMap((pair, i) => {
          const f = data.found[i];
          return f ? [foundItem(f, `${upper(pair.left + f)} · ${upper(f + pair.right)}`)] : [];
        }),
      }),
      result: (gaveUp) => resultFor(data, puzzle, gaveUp),
      onRender(finished) {
        replaceChildren(
          list,
          puzzle.pairs.map((pair, i) => row(pair, i, finished)),
        );
        const left = data.found.filter((f) => !f).length;
        progress.textContent = left
          ? `${left} to find · type a word that fits any pair`
          : 'All found!';
      },
    });
  },

  summarise({ puzzle, solution, data, date }) {
    return {
      detail: describeOutcome(data, puzzle.pairs.length),
      answersLabel: "Today's hinges",
      // "PET: CARPET · PETROL", with both joined words to look up.
      answers: puzzle.pairs.map((pair, i) => {
        const hinge = solution.answers[i] ?? '';
        return [
          h('strong', null, hinge.toUpperCase()),
          ': ',
          lookUp(pair.left + hinge),
          ' · ',
          lookUp(hinge + pair.right),
        ];
      }),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLines(data),
        url: gameUrl(SLUG),
      }),
    };
  },
};
