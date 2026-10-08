/**
 * The board shared by "word hunt" games, where you enter as many words as you
 * like and your best one counts (Price Tag, Threader, …). It handles the word
 * box, keyboard, list of words found, the Finish and See results buttons, and
 * saving and ending the game. A game supplies only its rules: how to check a
 * word, how to rank words, what to say about them, and any extra panels.
 */

import { bestWord, type CompareWords } from '../core/best-word.ts';
import type { GameResult } from '../core/progress.ts';
import { h, replaceChildren } from './dom.ts';
import type { GameContext } from './game-shell.ts';
import { createKeyboard, type Keyboard } from './keyboard.ts';
import { confirmModal } from './modal.ts';
import { createWordInput, type WordInput } from './word-input.ts';

/** Saved state for a word hunt: the accepted words, in the order found. */
export interface WordHuntData {
  words: string[];
}

export interface WordHuntOptions<P, S> {
  ctx: GameContext<P, S, WordHuntData>;
  /** Panels above the word box (the puzzle itself). */
  top: Node[];
  /** Lines under the word box, e.g. a live running cost. Hidden once finished. */
  belowInput?: Node[];
  /** Why a word can't be accepted, or null if it can. */
  problem(word: string, found: readonly string[]): string | null;
  /** How to rank words: positive if a beats b. */
  compare: CompareWords;
  /** Short description for the found list, e.g. "5 letters, 18p". */
  describe(word: string): string;
  /** Message after a word is accepted. */
  accepted(word: string, isNewBest: boolean): string;
  /** Score the words found against the optimum. */
  result(words: readonly string[], gaveUp: boolean): GameResult;
  /** Called whenever the board redraws, with the current best word (or null). */
  onRender?(best: string | null): void;
  /** Extra word box options, e.g. to veto letters or react to typing. */
  allowLetter?(current: string, letter: string): boolean;
  onType?(word: string): void;
}

export interface WordHunt {
  input: WordInput;
  keyboard: Keyboard;
}

export function mountWordHunt<P, S>(opts: WordHuntOptions<P, S>): WordHunt {
  const { ctx } = opts;
  const words = [...ctx.data.words];
  const data: WordHuntData = { words };
  let finished = ctx.finished;

  const input = createWordInput({
    label: 'Your word',
    onSubmit: submit,
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
    const best = bestWord(words, opts.compare);
    foundHeading.textContent = `Words found: ${words.length}`;
    const sorted = [...words].sort((a, b) => opts.compare(b, a) || a.localeCompare(b));
    replaceChildren(
      foundList,
      sorted.map((word) =>
        h(
          'li',
          null,
          h('span', { class: 'found-word' }, word),
          h('span', { class: 'found-meta' }, opts.describe(word)),
          word === best ? h('span', { class: 'best-tag' }, '★ Best') : null,
        ),
      ),
    );
    input.setDisabled(finished);
    for (const el of [keyboard.el, input.el, ...below]) (el as HTMLElement).hidden = finished;
    replaceChildren(actions, finished ? resultsButton : finishButton);
    opts.onRender?.(best);
  }

  function end(gaveUp: boolean) {
    finished = true;
    render();
    ctx.finish(data, opts.result(words, gaveUp));
  }

  function submit(word: string) {
    if (!word) return;
    const problem = opts.problem(word, words);
    if (problem) return input.feedback(problem, 'bad');

    const previous = bestWord(words, opts.compare);
    words.push(word);
    input.setValue('');
    input.feedback(
      opts.accepted(word, previous === null || opts.compare(word, previous) > 0),
      'good',
    );

    if (opts.result(words, false).perfect) return end(false);
    ctx.save(data);
    render();
  }

  function confirmFinish() {
    confirmModal({
      title: 'Finish now?',
      message: "You'll see the best possible answer and won't be able to add more words.",
      confirmLabel: 'Finish and see answers',
      cancelLabel: 'Keep playing',
      onConfirm: () => end(true),
    });
  }

  ctx.root.append(
    ...opts.top,
    input.el,
    ...below,
    keyboard.el,
    actions,
    h('section', { class: 'found-section', 'aria-label': 'Words found' }, foundHeading, foundList),
  );
  render();
  if (!finished) input.focus();
  return { input, keyboard };
}
