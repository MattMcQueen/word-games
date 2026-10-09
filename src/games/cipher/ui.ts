/**
 * Cipher's board: the coded line, one button per letter, with the player's
 * letter above each code letter. Choose a code letter (tap it, or move with
 * the arrow keys), then type the letter it stands for; every copy of that
 * code letter fills in at once. There's no word box: typing goes straight to
 * the chosen letter. The rules themselves live in scoring.ts.
 */

import { puzzleNumber } from '../../core/date.ts';
import { buildShareText } from '../../core/share.ts';
import { plural } from '../../core/text.ts';
import { bookCredit } from '../../ui/book-link.ts';
import { h, replaceChildren } from '../../ui/dom.ts';
import type { GameModule } from '../../ui/game-shell.ts';
import { createKeyboard } from '../../ui/keyboard.ts';
import { confirmModal } from '../../ui/modal.ts';
import { finishOrResults } from '../../ui/word-board.ts';
import { gameUrl } from '../catalogue.ts';
import { cipherLogic } from './logic.ts';
import {
  type CipherData,
  clearLetter,
  describeOutcome,
  emptyData,
  hintTarget,
  isCracked,
  placedCount,
  placeLetter,
  resultFor,
  revealLetter,
  shareLines,
  wrongCount,
} from './scoring.ts';
import {
  type CipherPuzzle,
  type CipherSolution,
  codeLetters,
  isLetter,
  NAME,
  SLUG,
} from './spec.ts';
import './cipher.css';

const ALPHABET = [...'abcdefghijklmnopqrstuvwxyz'];

interface Cell {
  code: string;
  el: HTMLButtonElement;
  guess: HTMLElement;
}

export const cipherGame: GameModule<CipherPuzzle, CipherSolution, CipherData> = {
  logic: cipherLogic,
  name: NAME,
  initialData: emptyData,

  mount(ctx) {
    const { puzzle, solution } = ctx;
    const { book } = puzzle;
    const total = codeLetters(puzzle.coded).length;
    let data: CipherData = { guesses: { ...ctx.data.guesses }, revealed: [...ctx.data.revealed] };
    let finished = ctx.finished;

    // One button per letter of the line, in reading order; the cursor is the chosen one.
    const cells: Cell[] = [];
    let cursor = 0;
    const chosen = () => (finished ? null : (cells[cursor]?.code ?? null));

    const line = h('div', {
      class: 'cp-line',
      role: 'group',
      'aria-label': 'The coded line',
      onkeydown: onLineKey,
    });
    for (const word of puzzle.coded.split(' ')) {
      const wordEl = h('span', { class: 'cp-word' });
      for (const ch of word) {
        if (!isLetter(ch)) {
          wordEl.append(h('span', { class: 'cp-punct', 'aria-hidden': 'true' }, ch));
          continue;
        }
        const index = cells.length;
        const guess = h('span', { class: 'cp-guess' });
        const el = h(
          'button',
          { class: 'cp-cell', type: 'button', tabindex: -1, onclick: () => choose(index) },
          guess,
          h('span', { class: 'cp-code', 'aria-hidden': 'true' }, ch.toUpperCase()),
        );
        cells.push({ code: ch, el, guess });
        wordEl.append(el);
      }
      line.append(wordEl);
    }

    const status = h('p', { class: 'cp-status', 'aria-hidden': 'true' });
    const progress = h('p', { class: 'live-line', 'aria-hidden': 'true' });
    const feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
    const hintButton = h(
      'button',
      { class: 'btn quiet cp-hint', type: 'button', onclick: hint },
      'Reveal a letter',
    );
    const keyboard = createKeyboard({
      onLetter: place,
      onBackspace: clear,
      onEnter: () => moveToBlank(),
    });
    const actions = h('div', { class: 'board-actions' });
    const creditBox = h('div', { class: 'cp-credit' });

    const say = (message: string, kind: 'info' | 'good' | 'bad' = 'info') => {
      feedback.textContent = message;
      feedback.dataset.kind = kind;
    };

    /** Make cell `i` the chosen one, keeping keyboard focus with it if it was in the line. */
    function choose(i: number) {
      if (finished || !cells[i]) return;
      const focusHere = line.contains(document.activeElement);
      cursor = i;
      render();
      if (focusHere) cells[i]?.el.focus();
    }

    /** Arrow keys move along the line; Home and End jump to its ends. */
    function onLineKey(event: Event) {
      const e = event as KeyboardEvent;
      const moves: Record<string, number> = {
        ArrowRight: cursor + 1,
        ArrowDown: cursor + 1,
        ArrowLeft: cursor - 1,
        ArrowUp: cursor - 1,
        Home: 0,
        End: cells.length - 1,
      };
      const to = moves[e.key];
      if (to === undefined) return;
      e.preventDefault();
      choose(Math.max(0, Math.min(cells.length - 1, to)));
    }

    /** Move to the next letter (after the cursor, wrapping round) whose code letter is still blank. */
    function moveToBlank() {
      for (let step = 1; step <= cells.length; step++) {
        const i = (cursor + step) % cells.length;
        if (!data.guesses[cells[i]?.code as string]) return choose(i);
      }
    }

    function place(letter: string) {
      const code = chosen();
      if (!code) return;
      const outcome = placeLetter(data, code, letter);
      if ('problem' in outcome) return say(outcome.problem, 'bad');
      data = outcome.data;
      say(`${code.toUpperCase()} is now ${letter.toUpperCase()}.`);
      changed(true);
    }

    function clear() {
      const code = chosen();
      if (!code || !data.guesses[code]) return;
      const next = clearLetter(data, code);
      if (next === data)
        return say(`${code.toUpperCase()} was given away, so it can't change.`, 'bad');
      data = next;
      say(`${code.toUpperCase()} is blank again.`);
      changed(false);
    }

    function hint() {
      const code = hintTarget(puzzle, solution, data, chosen());
      if (!code) return;
      data = revealLetter(data, solution, code);
      say(`${code.toUpperCase()} is ${solution.key[code]?.toUpperCase()}.`);
      changed(true);
    }

    /** After any change: finish if it's cracked, say so if it's full but wrong, else move on. */
    function changed(moveOn: boolean) {
      if (isCracked(puzzle, solution, data)) return end(false);
      ctx.save(data);
      if (placedCount(puzzle, data) === total) {
        const wrong = wrongCount(puzzle, solution, data);
        say(
          `Every letter is placed, but ${plural(wrong, 'letter')} ${wrong === 1 ? "isn't" : "aren't"} right yet.`,
          'bad',
        );
      } else if (moveOn) {
        return moveToBlank();
      }
      render();
    }

    function end(gaveUp: boolean) {
      finished = true;
      render();
      ctx.finish(data, resultFor(puzzle, solution, data, gaveUp));
    }

    function confirmFinish() {
      confirmModal({
        title: 'Finish now?',
        message: [
          "You'll see the line and won't be able to place any more letters.",
          'To place a letter, choose Keep playing, pick a code letter and type.',
        ],
        confirmLabel: 'Finish and see the line',
        cancelLabel: 'Keep playing',
        onConfirm: () => end(true),
      });
    }

    function render() {
      const code = chosen();
      cells.forEach((cell, i) => {
        // Once it's over, every letter shows; the ones the player didn't get are marked.
        const letter = finished ? solution.key[cell.code] : data.guesses[cell.code];
        const given = data.revealed.includes(cell.code);
        const missed = finished && data.guesses[cell.code] !== solution.key[cell.code];
        cell.guess.textContent = letter?.toUpperCase() ?? '';
        cell.el.classList.toggle('cp-on', cell.code === code);
        cell.el.classList.toggle('cp-given', given);
        cell.el.classList.toggle('cp-missed', missed);
        cell.el.tabIndex = !finished && i === cursor ? 0 : -1;
        cell.el.disabled = finished;
        cell.el.setAttribute('aria-pressed', String(cell.code === code));
        const now = letter ? `${given ? 'given ' : ''}${letter.toUpperCase()}` : 'blank';
        cell.el.setAttribute('aria-label', `${cell.code.toUpperCase()}: ${now}`);
      });

      const used = new Set(Object.values(data.guesses));
      for (const letter of ALPHABET) {
        keyboard.setKey(letter, used.has(letter) ? { highlight: true, hint: '✓' } : {});
      }
      status.textContent = code
        ? `${code.toUpperCase()} stands for ${data.guesses[code]?.toUpperCase() ?? '?'}`
        : '';
      progress.textContent = `${placedCount(puzzle, data)} of ${total} letters placed · ${plural(data.revealed.length, 'hint')}`;
      for (const el of [status, progress, feedback, hintButton, keyboard.el]) el.hidden = finished;

      replaceChildren(
        creditBox,
        finished
          ? [
              h('p', { class: 'cp-plain' }, solution.line),
              ...bookCredit(book.title, book.author, 'From '),
            ]
          : [],
      );
      replaceChildren(actions, finishOrResults(finished, confirmFinish, ctx.showResults));
    }

    // Typing anywhere on the page places a letter in the chosen code letter.
    document.addEventListener('keydown', (e) => {
      if (finished || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('dialog[open]')) return;
      if ((e.target as Element | null)?.closest('input, textarea, select')) return;
      if (/^[a-z]$/i.test(e.key)) {
        e.preventDefault();
        place(e.key.toLowerCase());
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        clear();
      }
    });

    ctx.root.append(
      h(
        'section',
        { class: 'panel cp-panel', 'aria-label': 'The code' },
        h(
          'p',
          { class: 'cp-label' },
          'Each letter stands for a different one. Crack the code to read a line from a classic novel.',
        ),
        line,
        creditBox,
      ),
      h('div', { class: 'cp-bar' }, status, hintButton),
      progress,
      feedback,
      keyboard.el,
      actions,
    );
    // Start on the first blank letter.
    cursor = Math.max(
      0,
      cells.findIndex((cell) => !data.guesses[cell.code]),
    );
    render();
  },

  summarise({ puzzle, solution, data, date }) {
    return {
      detail: describeOutcome(puzzle, solution, data),
      answersLabel: "Today's line",
      prose: true,
      answers: [solution.line],
      credit: bookCredit(puzzle.book.title, puzzle.book.author, 'From '),
      shareText: buildShareText({
        game: NAME,
        puzzleNumber: puzzleNumber(date),
        lines: shareLines(puzzle, solution, data),
        url: gameUrl(SLUG),
      }),
    };
  },
};
