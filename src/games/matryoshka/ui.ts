/**
 * Matryoshka's board: the chain so far as a stack of nested words, each with
 * its new letter marked, plus Undo to back out of a dead end, on the common
 * word board. The rules themselves live in scoring.ts.
 */

import { puzzleNumber } from '../../core/date.ts';
import { buildShareText } from '../../core/share.ts';
import { letters, plural } from '../../core/text.ts';
import { h, replaceChildren, targetLine } from '../../ui/dom.ts';
import type { GameContext, GameModule } from '../../ui/game-shell.ts';
import { foundItem, mountWordBoard, type WordBoard } from '../../ui/word-board.ts';
import { gameUrl } from '../catalogue.ts';
import { matryoshkaLogic } from './logic.ts';
import { chainLabel, describeOutcome, nextProblem, resultFor, shareLines } from './scoring.ts';
import { nextWords } from './solve.ts';
import { insertedAt, type MatryoshkaPuzzle, type MatryoshkaSolution, NAME, SLUG } from './spec.ts';
import './matryoshka.css';

interface MatryoshkaData {
  /** The chain being built, after the seed. */
  chain: string[];
  /** The longest chain built so far (kept when you undo). */
  best: string[];
}

/** One row of the stack, with the letter that was added marked (bold and underlined). */
function dollRow(word: string, previous: string | null, isSeed: boolean) {
  const at = previous === null ? -1 : insertedAt(previous, word);
  return h(
    'li',
    { class: isSeed ? 'mt-row mt-seed' : 'mt-row' },
    h(
      'span',
      { class: 'mt-word' },
      [...word.toUpperCase()].map((ch, i) => h('span', { class: i === at ? 'mt-new' : null }, ch)),
    ),
    isSeed ? h('span', { class: 'mt-tag' }, 'seed') : null,
  );
}

export const matryoshkaGame: GameModule<MatryoshkaPuzzle, MatryoshkaSolution, MatryoshkaData> = {
  logic: matryoshkaLogic,
  name: NAME,
  initialData: () => ({ chain: [], best: [] }),

  mount(ctx) {
    const { puzzle, solution, dict } = ctx;
    const data: MatryoshkaData = { chain: [...ctx.data.chain], best: [...ctx.data.best] };
    const current = () => data.chain.at(-1) ?? puzzle.seed;

    const stack = h('ol', { class: 'mt-stack', 'aria-label': 'Your chain' });
    const hint = h('p', { class: 'live-line' });
    let board: WordBoard | undefined;
    const undo = h(
      'button',
      {
        class: 'btn quiet',
        type: 'button',
        onclick: () => {
          data.chain.pop();
          board?.input.feedback('');
          board?.commit();
          board?.input.focus();
        },
      },
      'Undo last word',
    );

    board = mountWordBoard({
      ctx: ctx as GameContext<unknown, unknown, MatryoshkaData>,
      data,
      top: [
        h(
          'section',
          { class: 'panel mt-panel', 'aria-label': 'Chain' },
          h('p', { class: 'mt-label' }, 'Add one letter at a time. Every step must be a word.'),
          targetLine(`a chain of ${plural(solution.best, 'word')}`),
          stack,
          h('div', { class: 'mt-tools' }, undo),
        ),
      ],
      belowInput: [hint],
      allowLetter: (typed) => typed.length < current().length + 1,
      submit(word, { input, commit }) {
        const problem = nextProblem(word, current(), dict);
        if (problem) return input.feedback(problem, 'bad');
        data.chain.push(word);
        if (data.chain.length > data.best.length) data.best = [...data.chain];
        input.setValue('');
        const stuck = nextWords(word, dict).length === 0;
        input.feedback(
          stuck
            ? `${word.toUpperCase()} is a dead end: no word can be made from it. Undo to try another way.`
            : `${word.toUpperCase()}: chain of ${data.chain.length}.`,
          stuck ? 'info' : 'good',
        );
        commit();
      },
      found: () => ({
        heading: `Your longest chain: ${data.best.length}`,
        items: data.best.map((w) => foundItem(w, letters(w.length))),
      }),
      result: (gaveUp) => resultFor(data.best, solution, gaveUp),
      onRender(finished) {
        const words = [puzzle.seed, ...data.chain];
        replaceChildren(
          stack,
          words.map((w, i) => dollRow(w, i === 0 ? null : (words[i - 1] as string), i === 0)),
        );
        hint.textContent = `Add one letter anywhere in ${current().toUpperCase()}`;
        undo.disabled = data.chain.length === 0;
        undo.hidden = finished;
      },
    });
  },

  summarise({ puzzle, solution, data, date }) {
    return {
      detail: describeOutcome(data.best.length, solution.best, puzzle.seed),
      answersLabel: solution.chains.length === 1 ? 'A longest chain' : 'Some longest chains',
      answers: solution.chains.map((c) => chainLabel([puzzle.seed, ...c])),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLines(data.best.length, solution.best),
        url: gameUrl(SLUG),
      }),
    };
  },
};
