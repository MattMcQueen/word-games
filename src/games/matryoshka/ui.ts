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
import { lookUp } from '../../ui/results.ts';
import { foundItem, mountWordBoard, type WordBoard } from '../../ui/word-board.ts';
import { gameUrl } from '../catalogue.ts';
import { matryoshkaLogic } from './logic.ts';
import { describeOutcome, nextProblem, resultFor, shareLines } from './scoring.ts';
import { chainLengths, nextWords } from './solve.ts';
import { insertedAt, type MatryoshkaPuzzle, type MatryoshkaSolution, NAME, SLUG } from './spec.ts';
import './matryoshka.css';

interface MatryoshkaData {
  /** The chain being built, after the seed. */
  chain: string[];
  /** The longest chain built so far (kept when you undo). */
  best: string[];
  /** Letters suggested by hints (missing in games saved before hints). */
  hints?: number;
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
    const data: MatryoshkaData = {
      chain: [...ctx.data.chain],
      best: [...ctx.data.best],
      hints: ctx.data.hints ?? 0,
    };
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

    // Stuck: suggest the letter to add next on a longest route from the current word.
    const longest = chainLengths(dict);
    const bestNext = () =>
      nextWords(current(), dict).reduce<string | null>(
        (top, w) => (top === null || longest(w) > longest(top) ? w : top),
        null,
      );
    const hintButton = h(
      'button',
      {
        class: 'btn quiet',
        type: 'button',
        onclick: () => {
          const next = bestNext();
          if (!next) return;
          data.hints = (data.hints ?? 0) + 1;
          const letter = next[insertedAt(current(), next)]?.toUpperCase();
          board?.input.feedback(`Hint: try adding ${letter} to ${current().toUpperCase()}.`);
          board?.commit();
          board?.input.focus();
        },
      },
      'Reveal a letter',
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
          h('div', { class: 'mt-tools' }, undo, hintButton),
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
      // The longest chain ends the game; it's perfect only without hints.
      result: (gaveUp) => {
        const result = resultFor(data.best, solution, gaveUp);
        return data.hints ? { ...result, perfect: false } : result;
      },
      done: () => resultFor(data.best, solution, false).perfect,
      onRender(finished) {
        hintButton.hidden = finished;
        hintButton.disabled = bestNext() === null;
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
      detail: `${describeOutcome(data.best.length, solution.best, puzzle.seed)}${data.hints ? ` You used ${plural(data.hints, 'hint')}.` : ''}`,
      answersLabel: solution.chains.length === 1 ? 'A longest chain' : 'Some longest chains',
      answers: solution.chains.map((c) => [
        puzzle.seed.toUpperCase(),
        ...c.flatMap((word) => [' → ', lookUp(word.toUpperCase())]),
      ]),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLines(data.best.length, solution.best, data.hints ?? 0),
        url: gameUrl(SLUG),
      }),
    };
  },
};
