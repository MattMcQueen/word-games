/**
 * The board every typed-word game is built on: the puzzle's own panels, the
 * word box and on-screen keyboard, the Finish / See results button, and a
 * list of what's been found. It also hides the controls once the puzzle is
 * finished and handles saving and ending.
 *
 * A game supplies what to do with a submitted word, how to draw the found
 * list, and how to score; see word-hunt.ts (best word counts) and Swap Shop
 * (find them all) for the two styles built on it.
 */

import type { GameResult } from '../core/progress.ts';
import { h, replaceChildren } from './dom.ts';
import type { GameContext } from './game-shell.ts';
import { createKeyboard, type Keyboard } from './keyboard.ts';
import { confirmModal } from './modal.ts';
import { createWordInput, type WordInput } from './word-input.ts';

export interface WordBoardOptions<D> {
  ctx: GameContext<unknown, unknown, D>;
  /** The game's state, mutated by submit() and saved by commit(). */
  data: D;
  /** Panels above the word box (the puzzle itself). */
  top: Node[];
  /** Lines under the word box, e.g. a live preview. Hidden once finished. */
  belowInput?: Node[];
  /** Handle a submitted, non-empty word: check it, update data, give feedback, then board.commit(). */
  submit(word: string, board: WordBoard): void;
  /** The found list's heading and items, redrawn after every change. */
  found(): { heading: string; items: Node[] };
  /** Score the current state. A perfect result ends the game. */
  result(gaveUp: boolean): GameResult;
  /** Called after every redraw, for the game's own panels. */
  onRender?(): void;
  /** Extra word box options, e.g. to veto letters or react to typing. */
  allowLetter?(current: string, letter: string): boolean;
  onType?(word: string): void;
}

export interface WordBoard {
  input: WordInput;
  keyboard: Keyboard;
  /** After a change to data: end the game if it's now perfect, otherwise save and redraw. */
  commit(): void;
}

export function mountWordBoard<D>(opts: WordBoardOptions<D>): WordBoard {
  const { ctx, data } = opts;
  let finished = ctx.finished;

  const input = createWordInput({
    label: 'Your word',
    onSubmit: (word) => {
      if (word) opts.submit(word, board);
    },
    ...(opts.allowLetter ? { allowLetter: opts.allowLetter } : {}),
    ...(opts.onType ? { onChange: opts.onType } : {}),
  });
  const keyboard = createKeyboard(input.keyboardHandlers);
  const below = opts.belowInput ?? [];

  const foundHeading = h('h2', { class: 'found-heading' });
  const foundList = h('ul', { class: 'found-list' });
  const actions = h('div', { class: 'board-actions' });
  const finishButton = h(
    'button',
    { class: 'btn', type: 'button', onclick: confirmFinish },
    'Finish',
  );
  const resultsButton = h(
    'button',
    { class: 'btn primary', type: 'button', onclick: () => ctx.showResults() },
    'See results',
  );

  function render() {
    const { heading, items } = opts.found();
    foundHeading.textContent = heading;
    replaceChildren(foundList, items);
    input.setDisabled(finished);
    for (const el of [keyboard.el, input.el, ...below]) (el as HTMLElement).hidden = finished;
    replaceChildren(actions, finished ? resultsButton : finishButton);
    opts.onRender?.();
  }

  function end(gaveUp: boolean) {
    finished = true;
    render();
    ctx.finish(data, opts.result(gaveUp));
  }

  function confirmFinish() {
    confirmModal({
      title: 'Finish now?',
      message: "You'll see the answers and won't be able to add more words.",
      confirmLabel: 'Finish and see answers',
      cancelLabel: 'Keep playing',
      onConfirm: () => end(true),
    });
  }

  const board: WordBoard = {
    input,
    keyboard,
    commit() {
      if (opts.result(false).perfect) return end(false);
      ctx.save(data);
      render();
    },
  };

  ctx.root.append(
    ...opts.top,
    input.el,
    ...below,
    keyboard.el,
    actions,
    h('section', { class: 'found-section', 'aria-label': 'Found so far' }, foundHeading, foundList),
  );
  render();
  if (!finished) input.focus();
  return board;
}

/** One row of a found list: the word(s), a short description, and an optional tag. */
export function foundItem(word: string, meta: string, tag?: string): HTMLElement {
  return h(
    'li',
    null,
    h('span', { class: 'found-word' }, word),
    h('span', { class: 'found-meta' }, meta),
    tag ? h('span', { class: 'best-tag' }, tag) : null,
  );
}
