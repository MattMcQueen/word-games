/**
 * Shelf Scramble's board: the jumbled title, word by word, on the title board
 * it shares with Retitled (../title-board.ts), which adds the hints and the
 * link to buy the book. The rules themselves live in scoring.ts.
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
import { shelfScrambleLogic } from './logic.ts';
import {
  describeOutcome,
  emptyData,
  matchGuess,
  resultFor,
  type ShelfScrambleData,
  shareLines,
} from './scoring.ts';
import {
  isGiven,
  NAME,
  type ShelfScramblePuzzle,
  type ShelfScrambleSolution,
  SLUG,
} from './spec.ts';
import './shelf-scramble.css';

export const shelfScrambleGame: GameModule<
  ShelfScramblePuzzle,
  ShelfScrambleSolution,
  ShelfScrambleData
> = {
  logic: shelfScrambleLogic,
  name: NAME,
  initialData: emptyData,

  mount(ctx) {
    const { puzzle, solution } = ctx;

    /** One word of the title: its jumbled tiles, or the word itself once found. */
    function wordView(i: number, data: TitleData, finished: boolean) {
      const word = solution.words[i] as string;
      const done = Boolean(data.found[i]) || finished;
      const letters = done ? [...word] : [...(puzzle.tiles[i] as string)];
      const shown = data.revealed[i] ?? 0;
      const spoken = done
        ? word
        : `jumbled ${plural(word.length, 'letter')}: ${letters.join(' ').toUpperCase()}${shown ? `, starts ${word.slice(0, shown).toUpperCase()}` : ''}`;
      return h(
        'div',
        {
          class: `ss2-word ${data.found[i] ? 'ss2-done' : finished ? 'ss2-missed' : ''}`,
          role: 'listitem',
        },
        h('span', { class: 'sr-only' }, `Word ${i + 1}, ${spoken}`),
        h(
          'span',
          { class: 'ss2-tiles', 'aria-hidden': 'true' },
          letters.map((l) => h('span', { class: 'ss2-tile' }, l.toUpperCase())),
        ),
        !done && shown
          ? h(
              'span',
              { class: 'ss2-starts', 'aria-hidden': 'true' },
              `${word.slice(0, shown).toUpperCase()}…`,
            )
          : null,
      );
    }

    mountTitleBoard({
      ctx: ctx as GameContext<unknown, unknown, TitleData>,
      words: solution.words,
      title: solution.title,
      author: solution.author,
      given: solution.words.map(isGiven),
      panelLabel: 'The jumbled title',
      instruction: "Unjumble each word to find a well-known book's title.",
      wordView,
      matchGuess: (guess, data) => matchGuess(guess, solution, data),
      result: (data, gaveUp) => resultFor(solution, data, gaveUp),
    });
  },

  summarise({ solution, data, date }) {
    return {
      detail: describeOutcome(solution, data),
      answersLabel: "Today's book",
      prose: true,
      answers: [`${solution.title} by ${solution.author}`],
      credit: buyBookLink(solution.title, solution.author),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLines(solution, data),
        url: gameUrl(SLUG),
      }),
    };
  },
};
