/**
 * Retitled's board: the reworded title, and a row of letter boxes for each
 * word of the real one, on the title board it shares with Shelf Scramble
 * (../title-board.ts), which adds the hints and the link to buy the book. The
 * rules themselves live in scoring.ts.
 */

import { puzzleNumber } from '../../core/date.ts';
import { buildShareText } from '../../core/share.ts';
import { plural } from '../../core/text.ts';
import { buyBookLink } from '../../ui/book-link.ts';
import { h } from '../../ui/dom.ts';
import type { GameContext, GameModule } from '../../ui/game-shell.ts';
import { gameUrl } from '../catalogue.ts';
import { mountTitleBoard } from '../title-board.ts';
import type { TitleData } from '../title-words.ts';
import { retitledLogic } from './logic.ts';
import {
  describeOutcome,
  emptyData,
  matchGuess,
  type RetitledData,
  resultFor,
  shareLines,
} from './scoring.ts';
import { NAME, type RetitledPuzzle, type RetitledSolution, SLUG } from './spec.ts';
import './retitled.css';

export const retitledGame: GameModule<RetitledPuzzle, RetitledSolution, RetitledData> = {
  logic: retitledLogic,
  name: NAME,
  initialData: emptyData,

  mount(ctx) {
    const { puzzle, solution } = ctx;

    /** One word of the real title: a box per letter, filled in once found (or revealed). */
    function wordView(i: number, data: TitleData, finished: boolean) {
      const word = solution.words[i] as string;
      const done = Boolean(data.found[i]) || finished;
      const shown = done ? word.length : (data.revealed[i] ?? 0);
      const spoken = done
        ? word
        : `${plural(word.length, 'letter')}${shown ? `, starts ${word.slice(0, shown).toUpperCase()}` : ''}`;
      return h(
        'div',
        {
          class: `rt-word ${data.found[i] ? 'rt-done' : finished ? 'rt-missed' : ''}`,
          role: 'listitem',
        },
        h('span', { class: 'sr-only' }, `Word ${i + 1}, ${spoken}`),
        h(
          'span',
          { class: 'rt-boxes', 'aria-hidden': 'true' },
          [...word].map((ch, j) =>
            h(
              'span',
              { class: j < shown ? 'rt-box rt-shown' : 'rt-box' },
              j < shown ? ch.toUpperCase() : '',
            ),
          ),
        ),
      );
    }

    mountTitleBoard({
      ctx: ctx as GameContext<unknown, unknown, TitleData>,
      words: solution.words,
      title: solution.title,
      author: solution.author,
      given: puzzle.given,
      panelLabel: 'The reworded title',
      instruction: 'A famous book, its title reworded. What is it really called?',
      intro: h('p', { class: 'rt-clue' }, `“${puzzle.clue}”`),
      wordView,
      matchGuess: (guess, data) => matchGuess(guess, puzzle, solution, data),
      result: (data, gaveUp) => resultFor(puzzle, data, gaveUp),
    });
  },

  summarise({ puzzle, solution, data, date }) {
    return {
      detail: describeOutcome(puzzle, data),
      answersLabel: "Today's book",
      answers: [`“${puzzle.clue}” was ${solution.title} by ${solution.author}`],
      credit: buyBookLink(solution.title, solution.author),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLines(puzzle, data),
        url: gameUrl(SLUG),
      }),
    };
  },
};
