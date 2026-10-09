/**
 * Shelf Scramble's board: the jumbled title, word by word, with buttons to
 * show the author or reveal a letter, on the common word board. Once it's
 * over, the title and author appear with a link to buy the book. The rules
 * themselves live in scoring.ts.
 */

import { puzzleNumber } from '../../core/date.ts';
import { buildShareText } from '../../core/share.ts';
import { plural } from '../../core/text.ts';
import { buyBookLink } from '../../ui/book-link.ts';
import { h, replaceChildren } from '../../ui/dom.ts';
import type { GameContext, GameModule } from '../../ui/game-shell.ts';
import { foundItem, mountWordBoard, type WordBoard } from '../../ui/word-board.ts';
import { gameUrl } from '../catalogue.ts';
import { shelfScrambleLogic } from './logic.ts';
import {
  allFound,
  describeOutcome,
  emptyData,
  matchGuess,
  nextToReveal,
  resultFor,
  type ShelfScrambleData,
  shareLines,
} from './scoring.ts';
import { NAME, type ShelfScramblePuzzle, type ShelfScrambleSolution, SLUG } from './spec.ts';
import './shelf-scramble.css';

/** "Pride and Prejudice by Jane Austen", with a link to buy a copy. */
function credit(solution: ShelfScrambleSolution) {
  return [
    h('span', null, h('cite', null, solution.title), ` by ${solution.author}.`),
    buyBookLink(solution.title, solution.author),
  ];
}

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
    const data: ShelfScrambleData = {
      found: [...ctx.data.found],
      revealed: [...ctx.data.revealed],
      author: ctx.data.author,
    };
    const totalLetters = solution.words.join('').length;
    const title = h('div', { class: 'ss2-title', role: 'list', 'aria-label': 'The title' });
    const byline = h('p', { class: 'ss2-byline' });
    const creditLine = h('div', { class: 'ss2-credit' });
    const progress = h('p', { class: 'live-line', 'aria-hidden': 'true' });
    let board: WordBoard | undefined;

    const hint = (label: string, onclick: () => void) =>
      h('button', { class: 'btn quiet ss2-hint', type: 'button', onclick }, label);
    const authorButton = hint('Show the author', () => {
      data.author = true;
      board?.input.feedback('The author is shown below the title.');
      board?.commit();
      board?.input.focus();
    });
    const letterButton = hint('Reveal a letter', () => {
      const i = nextToReveal(solution, data);
      if (i === -1) return;
      data.revealed[i] = (data.revealed[i] ?? 0) + 1;
      board?.input.feedback(`Revealed a letter of word ${i + 1}.`);
      board?.commit();
      board?.input.focus();
    });
    const hints = h('div', { class: 'ss2-hints' }, authorButton, letterButton);

    /** One word of the title: its jumbled tiles, or the word itself once found. */
    function wordView(i: number, finished: boolean) {
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

    board = mountWordBoard({
      ctx: ctx as GameContext<unknown, unknown, ShelfScrambleData>,
      data,
      top: [
        h(
          'section',
          { class: 'panel ss2-panel', 'aria-label': 'The jumbled title' },
          h('p', { class: 'ss2-label' }, "Unjumble each word to find a well-known book's title."),
          title,
          byline,
          hints,
          creditLine,
        ),
      ],
      belowInput: [progress],
      // Long enough to type the whole title as one.
      maxLength: totalLetters,
      submit(guess, { input, commit, end }) {
        const match = matchGuess(guess, solution, data);
        if ('problem' in match) return input.feedback(match.problem, 'bad');
        for (const i of match.words) data.found[i] = true;
        input.setValue('');
        input.feedback(
          match.words.length > 1 ? 'The whole title!' : `${guess.toUpperCase()} is in place.`,
          'good',
        );
        if (allFound(data)) return end(false);
        commit();
      },
      found: () => ({
        heading: `Words in place: ${data.found.filter(Boolean).length} of ${solution.words.length}`,
        items: solution.words.flatMap((w, i) =>
          data.found[i] && w.length > 2 ? [foundItem(w, plural(w.length, 'letter'))] : [],
        ),
      }),
      result: (gaveUp) => resultFor(solution, data, gaveUp),
      onRender(finished) {
        replaceChildren(
          title,
          solution.words.map((_, i) => wordView(i, finished)),
        );
        byline.textContent =
          data.author || finished ? `By ${solution.author}` : 'By ? (a hint will show the author)';
        hints.hidden = finished;
        authorButton.disabled = data.author;
        letterButton.disabled = nextToReveal(solution, data) === -1;
        replaceChildren(creditLine, finished ? credit(solution) : []);
        const left = data.found.filter((f) => !f).length;
        progress.textContent = left
          ? `${plural(left, 'word')} to go · type a word, or the whole title`
          : 'All in place!';
      },
    });
  },

  summarise({ solution, data, date }) {
    return {
      detail: describeOutcome(solution, data),
      answersLabel: "Today's book",
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
