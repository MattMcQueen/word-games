/**
 * Lost for Words' board: the sentence with the missing word as a row of
 * boxes (revealed letters filled in), and once it's over, the whole sentence
 * and the book it's from, with a link to buy a copy. Built on the common word board.
 */

import { puzzleNumber } from '../../core/date.ts';
import { buildShareText } from '../../core/share.ts';
import { bookCredit } from '../../ui/book-link.ts';
import { h, replaceChildren } from '../../ui/dom.ts';
import type { GameContext, GameModule } from '../../ui/game-shell.ts';
import { foundItem, mountWordBoard } from '../../ui/word-board.ts';
import { gameUrl } from '../catalogue.ts';
import { lostForWordsLogic } from './logic.ts';
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
import { type LostForWordsPuzzle, type LostForWordsSolution, NAME, SLUG } from './spec.ts';
import './lost-for-words.css';

interface LostForWordsData {
  guesses: string[];
}

/** "From Pride and Prejudice by Jane Austen", with a link to buy a copy. */
const credit = ({ book }: LostForWordsPuzzle) => bookCredit(book.title, book.author, 'From ');

export const lostForWordsGame: GameModule<
  LostForWordsPuzzle,
  LostForWordsSolution,
  LostForWordsData
> = {
  logic: lostForWordsLogic,
  name: NAME,
  initialData: () => ({ guesses: [] }),

  mount(ctx) {
    const { puzzle, solution, dict } = ctx;
    const answer = solution.word;
    const data: LostForWordsData = { guesses: [...ctx.data.guesses] };

    const sentence = h('p', { class: 'lw-sentence' });
    const creditLine = h('p', { class: 'lw-credit' });
    const progress = h('p', { class: 'live-line' });

    mountWordBoard({
      ctx: ctx as GameContext<unknown, unknown, LostForWordsData>,
      data,
      top: [
        h(
          'section',
          { class: 'panel lw-panel', 'aria-label': 'The sentence' },
          h('p', { class: 'lw-label' }, 'Which word is missing?'),
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
            { class: finished ? 'lw-gap lw-filled' : 'lw-gap' },
            h(
              'span',
              { class: 'sr-only' },
              finished ? answer : `missing word, ${puzzle.length} letters: ${spoken}`,
            ),
            letters.map((l) =>
              h('span', { class: 'lw-box', 'aria-hidden': 'true' }, l.toUpperCase()),
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
