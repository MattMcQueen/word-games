/**
 * The word entry box, with a feedback line for validation messages.
 *
 * It's a real <input> (good for screen readers and physical keyboards) with
 * inputmode="none" so phones don't open their own keyboard over ours. The
 * value is kept to lowercase a–z, and games can veto letters (e.g. Lockout
 * blocks its locked-out letters).
 */

import { h } from './dom.ts';
import type { KeyboardHandlers } from './keyboard.ts';

export type FeedbackKind = 'info' | 'good' | 'bad';

export interface WordInputOptions {
  /** Accessible label, e.g. "Your word". */
  label: string;
  maxLength?: number;
  /** Return false to reject `letter` being added after `current`. */
  allowLetter?: (current: string, letter: string) => boolean;
  onChange?: (word: string) => void;
  onSubmit: (word: string) => void;
}

export interface WordInput {
  el: HTMLElement;
  readonly value: string;
  setValue(word: string): void;
  addLetter(letter: string): void;
  backspace(): void;
  submit(): void;
  /** Show a message under the box; 'bad' also gives a short shake. */
  feedback(message: string, kind?: FeedbackKind): void;
  setDisabled(disabled: boolean): void;
  focus(): void;
  /** Handlers to pass straight to createKeyboard(). */
  keyboardHandlers: KeyboardHandlers;
}

let counter = 0;

export function createWordInput(options: WordInputOptions): WordInput {
  const { label, maxLength = 15, allowLetter = () => true, onChange, onSubmit } = options;
  const id = `word-input-${++counter}`;

  const input = h('input', {
    id,
    class: 'word-input',
    type: 'text',
    inputmode: 'none',
    autocomplete: 'off',
    autocapitalize: 'none',
    spellcheck: 'false',
    enterkeyhint: 'enter',
    'aria-describedby': `${id}-feedback`,
  });
  const message = h('p', { id: `${id}-feedback`, class: 'feedback', 'aria-live': 'polite' });

  let value = '';

  /** Keep only letters the game allows, stopping at the first rejected one. */
  function sanitise(raw: string): string {
    let out = '';
    for (const ch of raw.toLowerCase().replace(/[^a-z]/g, '')) {
      if (out.length >= maxLength || !allowLetter(out, ch)) break;
      out += ch;
    }
    return out;
  }

  function setValue(next: string) {
    const clean = sanitise(next);
    input.value = clean;
    if (clean !== value) {
      value = clean;
      onChange?.(value);
    }
  }

  const api: WordInput = {
    el: h(
      'div',
      { class: 'word-entry' },
      h('label', { class: 'sr-only', for: id }, label),
      input,
      message,
    ),
    get value() {
      return value;
    },
    setValue,
    addLetter: (letter) => setValue(value + letter),
    backspace: () => setValue(value.slice(0, -1)),
    submit: () => {
      if (!input.disabled) onSubmit(value);
    },
    feedback(text, kind = 'info') {
      message.textContent = text;
      message.dataset.kind = kind;
      if (kind === 'bad') {
        input.classList.remove('shake');
        void input.offsetWidth; // restart the animation
        input.classList.add('shake');
      }
    },
    setDisabled(disabled) {
      input.disabled = disabled;
    },
    focus: () => input.focus({ preventScroll: true }),
    keyboardHandlers: {
      onLetter: (letter) => api.addLetter(letter),
      onEnter: () => api.submit(),
      onBackspace: () => api.backspace(),
    },
  };

  input.addEventListener('input', () => setValue(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      api.submit();
    }
  });

  // Typing anywhere on the page goes into the box (see shouldCapture).
  document.addEventListener('keydown', (e) => {
    if (!shouldCapture(e, input)) return;
    const action = pageKeyAction(e.key);
    if (!action) return;
    e.preventDefault();
    if (action === 'backspace') api.backspace();
    else if (action === 'enter') api.submit();
    else {
      api.focus();
      api.addLetter(action);
    }
  });

  return api;
}

/**
 * Whether a keypress elsewhere on the page should be redirected into the word
 * box: not when the box is disabled, a modifier is held, a dialog is open, or
 * the player is in a form field (including the box itself, which handles its
 * own keys). Enter on a focused button or link must still activate it.
 */
function shouldCapture(e: KeyboardEvent, input: HTMLInputElement): boolean {
  if (input.disabled || e.ctrlKey || e.metaKey || e.altKey) return false;
  if (document.querySelector('dialog[open]')) return false;
  const target = e.target as Element | null;
  if (target?.closest('input, textarea, select')) return false;
  return !(e.key === 'Enter' && target?.closest('button, a'));
}

/** Map a key to what it does in the word box: a letter, 'backspace', 'enter', or nothing. */
function pageKeyAction(key: string): string | null {
  if (/^[a-z]$/i.test(key)) return key.toLowerCase();
  if (key === 'Backspace') return 'backspace';
  if (key === 'Enter') return 'enter';
  return null;
}
