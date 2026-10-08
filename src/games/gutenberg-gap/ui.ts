/**
 * Gutenberg Gap's board: the sentence with the missing word as a row of
 * boxes (revealed letters filled in), and once it's over, the whole sentence
 * and a credit to the book and author. Built on the common word board.
 */

import { puzzleNumber } from '../../core/date.ts';
import { buildShareText } from '../../core/share.ts';
import { h, replaceChildren } from '../../ui/dom.ts';
import type { GameContext, GameModule } from '../../ui/game-shell.ts';
import { foundItem, mountWordBoard } from '../../ui/word-board.ts';
import { gameUrl } from '../catalogue.ts';
import { gutenbergGapLogic } from './logic.ts';
import {
  describeOutcome,
  guessProblem,
  isOver,
  pattern,
  resultFor,
  revealed,
  shareLines,
  wrongCount,
} from './scoring.ts';
import { bookUrl, type GutenbergGapPuzzle, type GutenbergGapSolution, NAME, SLUG } from './spec.ts';
import './gutenberg-gap.css';

interface GutenbergGapData {
  guesses: string[];
}

/** "From Pride and Prejudice by Jane Austen. Read it free on Project Gutenberg." */
function credit(puzzle: GutenbergGapPuzzle) {
  return [
    'From ',
    h('cite', null, puzzle.book.title),
    ` by ${puzzle.book.author}. `,
    h(
      'a',
      { href: bookUrl(puzzle.book), rel: 'noopener', target: '_blank' },
      'Read it free on Project Gutenberg',
    ),
  ];
}

export const gutenbergGapGame: GameModule<
  GutenbergGapPuzzle,
  GutenbergGapSolution,
  GutenbergGapData
> = {
  logic: gutenbergGapLogic,
  name: NAME,
  initialData: () => ({ guesses: [] }),

  mount(ctx) {
    const { puzzle, solution, dict } = ctx;
    const answer = solution.word;
    const data: GutenbergGapData = { guesses: [...ctx.data.guesses] };

    const sentence = h('p', { class: 'gg-sentence' });
    const creditLine = h('p', { class: 'gg-credit' });
    const progress = h('p', { class: 'live-line' });

    mountWordBoard({
      ctx: ctx as GameContext<unknown, unknown, GutenbergGapData>,
      data,
      top: [
        h(
          'section',
          { class: 'panel gg-panel', 'aria-label': 'The sentence' },
          h('p', { class: 'gg-label' }, 'Which word is missing?'),
          sentence,
          creditLine,
        ),
      ],
      belowInput: [progress],
      allowLetter: (typed) => typed.length < puzzle.length,
      submit(guess, { input, commit, end }) {
        const problem = guessProblem(guess, puzzle, dict, data.guesses);
        if (problem) return input.feedback(problem, 'bad');
        data.guesses.push(guess);
        input.setValue('');
        if (guess === answer) {
          input.feedback(`Yes! ${answer.toUpperCase()} it is.`, 'good');
          return end(false);
        }
        if (isOver(data.guesses, answer)) {
          input.feedback(`Not ${guess.toUpperCase()}. That was your last guess.`, 'bad');
          return end(false);
        }
        input.feedback(`Not ${guess.toUpperCase()}. Here's another letter.`, 'bad');
        commit();
      },
      found: () => ({
        heading: `Your guesses: ${data.guesses.length}`,
        items: data.guesses.map((g) => foundItem(g, g === answer ? '✓ right' : '✗ wrong')),
      }),
      result: (gaveUp) => resultFor(data.guesses, answer, gaveUp),
      onRender(finished) {
        const shown = finished
          ? new Set([...answer].map((_, i) => i))
          : revealed(puzzle, wrongCount(data.guesses, answer));
        const letters = pattern(answer, shown);
        const spoken = letters.map((l) => l.toUpperCase() || 'blank').join(', ');
        replaceChildren(
          sentence,
          puzzle.before,
          h(
            'span',
            { class: finished ? 'gg-gap gg-filled' : 'gg-gap' },
            h(
              'span',
              { class: 'sr-only' },
              finished ? answer : `missing word, ${puzzle.length} letters: ${spoken}`,
            ),
            letters.map((l) =>
              h('span', { class: 'gg-box', 'aria-hidden': 'true' }, l.toUpperCase()),
            ),
          ),
          puzzle.after,
        );
        replaceChildren(creditLine, finished ? credit(puzzle) : []);
        const left = puzzle.length - wrongCount(data.guesses, answer);
        progress.textContent = `${left} ${left === 1 ? 'guess' : 'guesses'} left · each wrong guess reveals a letter`;
      },
    });
  },

  summarise({ puzzle, solution, data, date }) {
    return {
      detail: describeOutcome(data.guesses, solution.word),
      answersLabel: 'The missing word',
      answers: [solution.word],
      credit: credit(puzzle),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLines(data.guesses, solution.word),
        url: gameUrl(SLUG),
      }),
    };
  },
};
