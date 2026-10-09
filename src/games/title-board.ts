/**
 * The board for guessing a book's title word by word, shared by Shelf
 * Scramble and Retitled, on top of the common word board. It draws the
 * byline, the two hint buttons (show the author, reveal a letter), the
 * progress line, the found list and, once it's over, the book with a link to
 * buy it. Each game supplies its own panel text and how a word is drawn.
 */

import type { GameResult } from '../core/progress.ts';
import { plural } from '../core/text.ts';
import { bookCredit } from '../ui/book-link.ts';
import { type Child, h, replaceChildren } from '../ui/dom.ts';
import type { GameContext } from '../ui/game-shell.ts';
import { foundItem, mountWordBoard, type WordBoard } from '../ui/word-board.ts';
import { allFound, nextToReveal, type TitleData } from './title-words.ts';
import './title-board.css';

export interface TitleBoardOptions {
  ctx: GameContext<unknown, unknown, TitleData>;
  /** The book: its title's words (lowercase), title and author. */
  words: readonly string[];
  title: string;
  author: string;
  /** Words that start in place, so aren't listed as found. */
  given: readonly boolean[];
  /** What the panel's for, read out by screen readers, e.g. "The jumbled title". */
  panelLabel: string;
  /** The panel's first line, saying what to do. */
  instruction: string;
  /** Anything else in the panel above the words (Retitled's reworded title). */
  intro?: Child;
  /** Draw word `i` of the title; `data` is the live state. */
  wordView(i: number, data: TitleData, finished: boolean): HTMLElement;
  /** What a typed guess does (see title-words.ts placedWords). */
  matchGuess(guess: string, data: TitleData): { words: number[] } | { problem: string };
  result(data: TitleData, gaveUp: boolean): GameResult;
}

export function mountTitleBoard(opts: TitleBoardOptions): void {
  const { ctx, words } = opts;
  const data: TitleData = {
    found: [...ctx.data.found],
    revealed: [...ctx.data.revealed],
    author: ctx.data.author,
  };
  const list = h('div', { class: 'tb-words', role: 'list', 'aria-label': 'The title' });
  const byline = h('p', { class: 'tb-byline' });
  const creditLine = h('div', { class: 'tb-credit' });
  const progress = h('p', { class: 'live-line', 'aria-hidden': 'true' });
  let board: WordBoard | undefined;

  /** After a hint: say what it did, save, and carry on typing. */
  const hinted = (message: string) => {
    board?.input.feedback(message);
    board?.commit();
    board?.input.focus();
  };
  const hint = (label: string, onclick: () => void) =>
    h('button', { class: 'btn quiet tb-hint', type: 'button', onclick }, label);
  const authorButton = hint('Show the author', () => {
    data.author = true;
    hinted('The author is shown below the title.');
  });
  const letterButton = hint('Reveal a letter', () => {
    const i = nextToReveal(words, data);
    if (i === -1) return;
    data.revealed[i] = (data.revealed[i] ?? 0) + 1;
    hinted(`Revealed a letter of word ${i + 1}.`);
  });
  const hints = h('div', { class: 'tb-hints' }, authorButton, letterButton);

  board = mountWordBoard({
    ctx,
    data,
    top: [
      h(
        'section',
        { class: 'panel tb-panel', 'aria-label': opts.panelLabel },
        h('p', { class: 'tb-label' }, opts.instruction),
        opts.intro,
        list,
        byline,
        hints,
        creditLine,
      ),
    ],
    belowInput: [progress],
    // Long enough to type the whole title as one.
    maxLength: words.join('').length,
    submit(guess, { input, commit, end }) {
      const match = opts.matchGuess(guess, data);
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
      heading: `Words in place: ${data.found.filter(Boolean).length} of ${words.length}`,
      items: words.flatMap((w, i) =>
        data.found[i] && !opts.given[i] ? [foundItem(w, plural(w.length, 'letter'))] : [],
      ),
    }),
    result: (gaveUp) => opts.result(data, gaveUp),
    onRender(finished) {
      replaceChildren(
        list,
        words.map((_, i) => opts.wordView(i, data, finished)),
      );
      byline.textContent =
        data.author || finished ? `By ${opts.author}` : 'By ? (a hint will show the author)';
      hints.hidden = finished;
      authorButton.disabled = data.author;
      letterButton.disabled = nextToReveal(words, data) === -1;
      replaceChildren(creditLine, finished ? bookCredit(opts.title, opts.author) : []);
      const left = data.found.filter((f) => !f).length;
      progress.textContent = left
        ? `${plural(left, 'word')} to go · type a word, or the whole title`
        : 'All in place!';
    },
  });
}
